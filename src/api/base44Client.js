import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

//Create a client with authentication required
export const base44 = {
  auth: {
    me: async () => null,
    logout: async () => {}
  },
  entities: {
    Synagogue: {
      get: async () => ({}),
      list: async () => [],
      delete: async () => {}
    },
    SynagogueAccount: {
      list: async () => []
    },
    PosterStat: {
      create: async () => {}
    },
    PublicPoster: {
      create: async () => {}
    },
    FeatureRequest: {
      list: async () => [],
      create: async () => {}
    }
  },
  asServiceRole: {
    entities: {
      SynagogueAccount: { list: async () => [] }
    }
  },
  functions: {
    invoke: async () => ({ data: { success: false } })
  }
};
