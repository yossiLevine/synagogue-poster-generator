import html2canvas from 'html2canvas';

function stripGradients(doc) {
  doc.querySelectorAll('img').forEach(img => { 
    try {
      const src = img.getAttribute('src') || '';
      if (src.startsWith('http') && !src.includes(window.location.host)) {
        img.crossOrigin = 'anonymous';
      }
      img.onerror = () => {
        img.style.display = 'none';
      };
    } catch { /* ignore */ }
  });
}


export async function capturePoster(scale = 2, targetId = 'print-area', options = {}) {
  // 1. Locate the target element
  let el = document.getElementById(targetId);
  if (!el) {
    el = document.querySelector(`#${targetId}`);
  }
  
  // Prefer #poster-wrapper if targetId is print-area and poster-wrapper exists
  if (el && targetId === 'print-area') {
    const wrapper = el.querySelector('#poster-wrapper');
    if (wrapper) {
      el = wrapper;
    }
  }

  if (!el) {
    throw new Error(`האלמנט להדפסה (${targetId}) לא נמצא`);
  }

  // Ensure target and ALL ancestors are rendered (e.g. mobile hidden panel)
  const hiddenAncestors = [];
  let parent = el;
  while (parent && parent !== document.body) {
    const computed = window.getComputedStyle(parent);
    if (parent.classList.contains('hidden') || computed.display === 'none') {
      hiddenAncestors.push({
        node: parent,
        hadHiddenClass: parent.classList.contains('hidden'),
        prevDisplay: parent.style.display
      });
      parent.classList.remove('hidden');
      parent.style.display = 'block';
    }
    parent = parent.parentElement;
  }

  // Wait for web fonts if available
  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // ignore
    }
  }

  // Standard A4 dimensions for print/PDF vs compact high-readability width for WhatsApp/image sharing
  const isA4 = options.format === 'a4';
  const A4_WIDTH = 794;
  const A4_HEIGHT = 1123;
  const SHARE_WIDTH = 660;
  
  const width = isA4 ? A4_WIDTH : (options.format === 'raw' ? (Math.ceil(el.getBoundingClientRect().width) || el.offsetWidth || 600) : SHARE_WIDTH);

  try {
    const canvas = await html2canvas(el, {
      scale: scale || 2.5,
      windowWidth: 1024,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
      imageTimeout: 15000,
      onclone: (doc, clonedEl) => {
        stripGradients(doc);
        
        // Remove 'hidden' from any cloned ancestors
        let cur = clonedEl;
        while (cur && cur !== doc.body) {
          if (cur.classList.contains('hidden')) {
            cur.classList.remove('hidden');
          }
          if (doc.defaultView?.getComputedStyle(cur).display === 'none') {
            cur.style.display = 'block';
          }
          cur = cur.parentElement;
        }

        // Prevent any text truncation/clipping in the captured clone
        doc.querySelectorAll('.truncate').forEach(node => {
          node.classList.remove('truncate');
          node.style.overflow = 'visible';
          node.style.textOverflow = 'clip';
          node.style.whiteSpace = 'normal';
        });

        // Move clonedEl directly to doc.body and remove all other clutter.
        // This completely eliminates RTL scroll offset, page margins, and parent flex shifts!
        doc.body.appendChild(clonedEl);
        Array.from(doc.body.children).forEach(child => {
          if (child !== clonedEl) {
            child.remove();
          }
        });

        // Expand any max-width constraints so poster and frame fill the full target width
        const constrainedNodes = clonedEl.querySelectorAll('[class*="max-w-"]');
        constrainedNodes.forEach(node => {
          node.style.maxWidth = '100%';
          node.style.width = '100%';
        });

        // Compensate for html2canvas baseline downward shift on Hebrew fonts inside background containers
        clonedEl.querySelectorAll('[data-capture-badge="true"]').forEach(badge => {
          badge.style.display = 'inline-flex';
          badge.style.alignItems = 'center';
          badge.style.justifyContent = 'center';
          badge.style.paddingTop = '4px';
          badge.style.paddingBottom = '10px';
          badge.style.lineHeight = '1.3';
        });

        clonedEl.querySelectorAll('[data-capture-row="true"]').forEach(row => {
          row.style.display = 'flex';
          row.style.alignItems = 'center';
          row.style.paddingTop = '6px';
          row.style.paddingBottom = '13px';
        });

        clonedEl.querySelectorAll('[data-capture-card="true"]').forEach(card => {
          card.style.paddingTop = '10px';
          card.style.paddingBottom = '16px';
        });

        clonedEl.querySelectorAll('[data-capture-text="true"]').forEach(txt => {
          txt.style.position = 'relative';
          txt.style.top = '-3px';
          txt.style.lineHeight = '1.35';
        });

        // Also lift any generic rounded pills/badges with background colors that weren't explicitly tagged
        clonedEl.querySelectorAll('.rounded-full, .rounded-lg, .rounded-xl').forEach(box => {
          if (box.hasAttribute('data-capture-badge') || box.hasAttribute('data-capture-row') || box.hasAttribute('data-capture-card')) return;
          const bg = box.style.backgroundColor;
          if (bg && bg !== 'transparent') {
            box.style.paddingBottom = '10px';
          }
        });

        doc.body.dir = 'rtl';
        doc.body.style.margin = '0px';
        doc.body.style.padding = '0px';
        doc.body.style.background = '#ffffff';
        doc.body.style.width = `${width}px`;
        doc.body.style.minWidth = `${width}px`;
        doc.body.style.overflow = 'visible';

        clonedEl.style.position = 'relative';
        clonedEl.style.left = '0px';
        clonedEl.style.top = '0px';
        clonedEl.style.margin = '0px';
        clonedEl.style.padding = '0px';
        clonedEl.style.width = `${width}px`;
        clonedEl.style.minWidth = `${width}px`;
        clonedEl.style.maxWidth = `${width}px`;
        clonedEl.style.boxSizing = 'border-box';
        clonedEl.style.transform = 'none';
        clonedEl.style.visibility = 'visible';
        clonedEl.style.opacity = '1';
        clonedEl.style.display = 'block';

        if (isA4) {
          // Harmoniously center the poster vertically in standard A4
          const contentH = clonedEl.scrollHeight;
          if (contentH < A4_HEIGHT) {
            clonedEl.style.minHeight = `${A4_HEIGHT}px`;
            const frameNode = clonedEl.querySelector('.relative.mx-auto') || clonedEl.firstElementChild;
            if (frameNode) {
              frameNode.style.minHeight = `${A4_HEIGHT}px`;
              frameNode.style.display = 'flex';
              frameNode.style.flexDirection = 'column';
              frameNode.style.justifyContent = 'center';
              const innerContainer = frameNode.querySelector('.relative.z-10');
              if (innerContainer) {
                innerContainer.style.flex = '1';
                innerContainer.style.display = 'flex';
                innerContainer.style.flexDirection = 'column';
                innerContainer.style.justifyContent = 'center';
              }
            }
          }
        }
      },
    });

    if (canvas.width < 50 || canvas.height < 50) {
      throw new Error('שגיאה בייצוא — הקנבס ריק. נסה שוב.');
    }

    const dataUrl = canvas.toDataURL(options.imageFormat || 'image/png');

    return {
      dataUrl,
      width: canvas.width,
      height: canvas.height,
      toString() { return dataUrl; },
      valueOf() { return dataUrl; },
    };
  } finally {
    hiddenAncestors.forEach(({ node, hadHiddenClass, prevDisplay }) => {
      node.style.display = prevDisplay;
      if (hadHiddenClass) node.classList.add('hidden');
    });
  }
}