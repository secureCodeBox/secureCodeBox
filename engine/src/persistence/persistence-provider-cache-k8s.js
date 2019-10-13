const {
  KubeConfig,
  Watch,
  ListWatch,
  CustomObjectsApi,
} = require('@kubernetes/client-node');

function getPersistenceProviderCache() {
  const kc = new KubeConfig();
  kc.loadFromCluster();
  const client = kc.makeApiClient(CustomObjectsApi);

  const namespace = process.env['NAMESPACE'];

  const persistenceProviderPath = `/api/experimental.securecodebox.io/v1/namespaces/${namespace}/persistenceproviders`;
  const persistenceProviderWatch = new Watch(kc);
  const persistenceProviderListFn = () =>
    client.listNamespacedCustomObject(
      'experimental.securecodebox.io',
      'v1',
      namespace,
      'persistenceproviders',
      undefined,
      undefined,
      'type=Structured'
    );

  return new ListWatch(
    persistenceProviderPath,
    persistenceProviderWatch,
    persistenceProviderListFn
  );
}

module.exports = getPersistenceProviderCache;
