const { scan } = require('./helpers');

jest.mock('@kubernetes/client-node', () => {
  // Lazily require the actual module to be able to use variables like CustomObjectsApi
  const actualKubernetesClientNode = jest.requireActual('@kubernetes/client-node');

  const { CustomObjectsApi, CoreV1Api, BatchV1Api } = actualKubernetesClientNode;

  const mockKubeConfigInstance = {
    makeApiClient: jest.fn((apiType) => {
      switch (apiType) {
        case CustomObjectsApi:
          return {
            createNamespacedCustomObject: jest.fn(),
            deleteNamespacedCustomObject: jest.fn(),
            getNamespacedCustomObjectStatus: jest.fn(),
            listNamespacedCustomObject: jest.fn(),
          };
        case CoreV1Api:
          return {
            readNamespacedPodLog: jest.fn(),
            listNamespacedPod: jest.fn(),
          };
        case BatchV1Api:
          return {
            listNamespacedJob: jest.fn(),
          };
        default:
          throw new Error('API type not supported');
      }
    }),
  };

  return {
    KubeConfig: jest.fn(() => mockKubeConfigInstance),
    ...actualKubernetesClientNode, // Spread the actual module exports
  };
});

describe('helpers', () => {
  let mockCreateNamespacedCustomObject, mockDeleteNamespacedCustomObject, mockGetNamespacedCustomObjectStatus,
      mockReadNamespacedPodLog, mockListNamespacedPod, mockListNamespacedJob, mockListNamespacedCustomObject;

  const { KubeConfig, CustomObjectsApi, CoreV1Api, BatchV1Api } = require('@kubernetes/client-node');

  beforeAll(() => {
    // Mock the KubeConfig constructor TODO: This is not working
    const kc = new KubeConfig(); 

    mockCreateNamespacedCustomObject = jest.fn();
    mockDeleteNamespacedCustomObject = jest.fn();
    mockGetNamespacedCustomObjectStatus = jest.fn();
    mockReadNamespacedPodLog = jest.fn();
    mockListNamespacedPod = jest.fn();
    mockListNamespacedJob = jest.fn();
    mockListNamespacedCustomObject = jest.fn();

    kc.makeApiClient = jest.fn().mockImplementation((apiType) => {
      if (apiType === CustomObjectsApi) {
        return {
          createNamespacedCustomObject: mockCreateNamespacedCustomObject,
          deleteNamespacedCustomObject: mockDeleteNamespacedCustomObject,
          getNamespacedCustomObjectStatus: mockGetNamespacedCustomObjectStatus,
          listNamespacedCustomObject: mockListNamespacedCustomObject,
        };
      } else if (apiType === CoreV1Api) {
        return {
          readNamespacedPodLog: mockReadNamespacedPodLog,
          listNamespacedPod: mockListNamespacedPod,
        };
      } else if (apiType === BatchV1Api) {
        return {
          listNamespacedJob: mockListNamespacedJob,
        };
      }
      throw new Error('API type not supported');
    });
  });

});
