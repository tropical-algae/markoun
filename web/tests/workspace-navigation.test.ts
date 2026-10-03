import assert from 'node:assert/strict'
import { after, before, beforeEach, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createServer, type ViteDevServer } from 'vite'
import { createPinia, setActivePinia } from 'pinia'
import { createApp } from 'vue'
import { createMemoryHistory, createRouter, routerKey, type Router } from 'vue-router'
import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'

let server: ViteDevServer
let useNodeStore: typeof import('../src/stores/note.ts').useNodeStore
let useSysStore: typeof import('../src/stores/system.ts').useSysStore
let useToastStore: typeof import('../src/stores/toast.ts').useToastStore
let install: typeof import('../src/router/workspace.ts').installWorkspaceNavigation
let useWorkspaceActions: typeof import('../src/composables/useWorkspaceActions.ts').useWorkspaceActions
let respond: (config: InternalAxiosRequestConfig) => Promise<unknown>
let requests: InternalAxiosRequestConfig[]
const detail = (content: string) => ({ content, meta: {}, history_enabled: false, default_revision_id: null })
const deferred = <T>() => {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}
const until = async (predicate: () => boolean) => {
  for (let i = 0; i < 100; i += 1) {
    if (predicate()) return
    await new Promise(resolve => setTimeout(resolve, 5))
  }
  assert.fail('Timed out waiting for state')
}
const httpError = (config: InternalAxiosRequestConfig, status: number) => new AxiosError(
  'Request failed', undefined, config, undefined,
  { status, statusText: 'Error', config, headers: {}, data: { status, message: 'Failure', data: null } },
)

before(async () => {
  axios.defaults.adapter = async config => {
    requests.push(config)
    return { status: 200, statusText: 'OK', headers: {}, config, data: { data: await respond(config) } }
  }
  const root = fileURLToPath(new URL('../', import.meta.url))
  server = await createServer({
    root, configFile: false, logLevel: 'error',
    resolve: { alias: { '@': `${root}src` } },
    server: { middlewareMode: true, watch: null, ws: false },
  })
  ;({ useNodeStore } = await server.ssrLoadModule('/src/stores/note.ts'))
  ;({ useSysStore } = await server.ssrLoadModule('/src/stores/system.ts'))
  ;({ useToastStore } = await server.ssrLoadModule('/src/stores/toast.ts'))
  ;({ installWorkspaceNavigation: install } = await server.ssrLoadModule('/src/router/workspace.ts'))
  ;({ useWorkspaceActions } = await server.ssrLoadModule('/src/composables/useWorkspaceActions.ts'))
})
after(async () => { await server?.close() })
beforeEach(() => {
  setActivePinia(createPinia())
  requests = []
  respond = async config => {
    if (config.url?.endsWith('/welcome-note')) return '# Welcome'
    if (config.url?.endsWith('/children')) return { path: config.params.path, children: [] }
    return detail('content')
  }
  useSysStore().authRequired = false
})

const routerForTest = () => {
  const component = { render: () => null }
  const router = createRouter({ history: createMemoryHistory(), routes: [
    { path: '/', name: 'Workspace', component, meta: { workspace: true } },
    { path: '/file/:path(.*)+', name: 'WorkspaceFile', component, meta: { workspace: true } },
    { path: '/login', name: 'Login', component },
  ] })
  install(router)
  return router
}

const actionsForTest = (router: Router) => createApp({ render: () => null })
  .provide(routerKey, router)
  .runWithContext(() => useWorkspaceActions())

test('deep links open a file without loading its ancestors and selection does not change the save target', async () => {
  const router = routerForTest()
  await router.push('/file/one/two/note.md')
  const store = useNodeStore()
  await until(() => store.currentFileStatus === 'ready')
  assert.equal(store.getCachedNode('one/two/note.md'), undefined)
  assert.equal(store.currentFile.path, 'one/two/note.md')
  store.selectItem({ path: 'image.png', name: 'image', suffix: 'png', type: 'file' })
  assert.equal(store.selectedItem?.path, 'image.png')
  store.currentFile.content = 'edited'
  await store.saveCurrentFileIfDirty()
  const save = requests.find(request => request.url?.endsWith('/save'))!
  assert.equal(JSON.parse(save.data).filepath, 'one/two/note.md')
  assert.equal(requests.some(request => request.url?.endsWith('/children')), false)
})

test('late reads cannot replace a newer file or restore a file after returning home', async () => {
  const first = deferred<unknown>()
  respond = async config => config.params.filepath === 'a.md' ? first.promise : detail('B')
  const store = useNodeStore()
  const old = store.loadFile('a.md')
  await store.loadFile('b.md')
  first.resolve(detail('A'))
  assert.equal(await old, false)
  assert.equal(store.currentFile.content, 'B')
  const last = deferred<unknown>()
  respond = async () => last.promise
  const pending = store.loadFile('c.md')
  store.showWelcome()
  last.resolve(detail('C'))
  assert.equal(await pending, false)
  assert.equal(store.hasCurrentFile, false)
})

test('failed autosave cancels navigation and retains the original draft and selection', async () => {
  const router = routerForTest()
  await router.push('/file/a.md')
  const store = useNodeStore()
  await until(() => store.currentFileStatus === 'ready')
  store.currentFile.content = 'unsaved A'
  respond = async config => { throw httpError(config, 500) }
  assert.ok(await router.push('/file/b.md'))
  assert.equal(router.currentRoute.value.path, '/file/a.md')
  assert.equal(store.currentFile.path, 'a.md')
  assert.equal(store.currentFile.content, 'unsaved A')
  assert.equal(store.selectedItem?.path, 'a.md')
  assert.equal(store.isCurrentFileDirty, true)
})

test('concurrent navigation shares a save and opens only the last target', async () => {
  const router = routerForTest()
  await router.push('/file/a.md')
  const store = useNodeStore()
  await until(() => store.currentFileStatus === 'ready')
  store.currentFile.content = 'saved A'
  const saved = deferred<unknown>()
  respond = async config => config.url?.endsWith('/save') ? saved.promise : detail(config.params.filepath)
  const first = router.push('/file/b.md')
  await until(() => store.isSavePending())
  const second = router.push('/file/c.md')
  saved.resolve({ history_enabled: false })
  await Promise.all([first, second])
  await until(() => store.currentFileStatus === 'ready' && store.currentFile.path === 'c.md')
  assert.equal(requests.filter(request => request.url?.endsWith('/save')).length, 1)
  assert.equal(store.currentFile.content, 'c.md')
})

test('missing file replaces the route with home and emits one notice, while server errors stay retryable', async () => {
  const router = routerForTest()
  respond = async config => {
    if (config.url?.endsWith('/welcome-note')) return '# Welcome'
    throw httpError(config, 404)
  }
  await router.push('/file/missing.md')
  await until(() => router.currentRoute.value.path === '/' && useNodeStore().currentFileStatus === 'ready')
  assert.equal(useNodeStore().hasCurrentFile, false)
  assert.equal(useNodeStore().selectedItem, null)
  assert.equal(useToastStore().queue.at(-1)?.message, 'File not found.')
  respond = async config => { throw httpError(config, 500) }
  await router.push('/file/error.md')
  await until(() => useNodeStore().currentFileStatus === 'error')
  assert.equal(router.currentRoute.value.path, '/file/error.md')
})

test('hash navigation does not reload the file or overwrite an independent tree selection', async () => {
  const router = routerForTest()
  await router.push('/file/a.md')
  const store = useNodeStore()
  await until(() => store.currentFileStatus === 'ready')
  store.selectItem({ path: 'folder', name: 'folder', suffix: '', type: 'dir' })
  const count = requests.length
  await router.push('/file/a.md#section')
  assert.equal(requests.length, count)
  assert.equal(store.selectedItem?.path, 'folder')
  await router.push('/')
  await until(() => !store.hasCurrentFile)
})

test('edits made during autosave are retained instead of being discarded by navigation', async () => {
  const router = routerForTest()
  await router.push('/file/a.md')
  const store = useNodeStore()
  await until(() => store.currentFileStatus === 'ready')
  store.currentFile.content = 'first edit'
  const saved = deferred<unknown>()
  respond = async () => saved.promise
  const navigation = router.push('/file/b.md')
  await until(() => store.isSavePending())
  assert.equal(store.canEditCurrentFile, true)
  store.currentFile.content = 'edited again during save'
  saved.resolve({ history_enabled: false })
  assert.ok(await navigation)
  assert.equal(router.currentRoute.value.path, '/file/a.md')
  assert.equal(store.currentFile.content, 'edited again during save')
  assert.equal(store.isCurrentFileDirty, true)
})

test('renaming a parent keeps selection, open file and loaded directory records in sync', async () => {
  const router = routerForTest()
  const actions = actionsForTest(router)
  const store = useNodeStore()
  respond = async config => {
    if (config.url?.endsWith('/children')) {
      return { path: 'folder', children: [{ path: 'folder/a.md', name: 'a', suffix: 'md', type: 'file' }] }
    }
    return detail('A')
  }
  await store.expandDirectory('folder')
  await router.push('/file/folder/a.md')
  await until(() => store.currentFileStatus === 'ready')
  const folder = { path: 'folder', name: 'folder', suffix: '', type: 'dir' } as const
  store.selectItem(folder)
  const oldContent = store.currentFile.content
  const oldFile = store.currentFile
  const readCount = requests.filter(request => request.url?.endsWith('/load')).length
  await actions.renameNode(folder, 'renamed')
  assert.equal(router.currentRoute.value.path, '/file/renamed/a.md')
  assert.equal(store.currentFile.path, 'renamed/a.md')
  assert.equal(store.currentFile, oldFile)
  assert.deepEqual(store.selectedItem, { path: 'renamed', type: 'dir' })
  assert.equal(store.getCachedNode('renamed/a.md')?.path, 'renamed/a.md')
  assert.equal(store.getCachedNode('folder/a.md'), undefined)
  assert.equal(store.isDirectoryExpanded('renamed'), true)
  assert.equal(store.currentFile.content, oldContent)
  assert.equal(requests.filter(request => request.url?.endsWith('/load')).length, readCount)
})

test('loading content does not change tree selection or close an independent image preview', async () => {
  const store = useNodeStore()
  const image = { path: 'image.png', name: 'image', suffix: 'png', type: 'file' } as const
  store.selectItem(image)
  await store.loadFile('a.md')
  assert.deepEqual(store.selectedItem, { path: image.path, type: 'file' })
  assert.equal(store.currentPreviewImageNode?.path, image.path)
})

test('explicitly opening the current file selects it without rereading or discarding edits', async () => {
  const router = routerForTest()
  const actions = actionsForTest(router)
  await router.push('/file/a.md')
  const store = useNodeStore()
  await until(() => store.currentFileStatus === 'ready')
  store.currentFile.content = 'draft'
  store.selectItem({ path: 'folder', name: 'folder', suffix: '', type: 'dir' })
  const readCount = requests.length
  await actions.openNode({ path: 'a.md', name: 'a', suffix: 'md', type: 'file' })
  assert.equal(store.selectedItem?.path, 'a.md')
  assert.equal(store.currentFile.content, 'draft')
  assert.equal(requests.length, readCount)
})

for (const operation of ['rename', 'move'] as const) {
  test(`${operation} synchronizes the URL without saving edits made during the request`, async () => {
    const router = routerForTest()
    const actions = actionsForTest(router)
    const store = useNodeStore()
    await router.push('/file/a.md?mode=read#section')
    await until(() => store.currentFileStatus === 'ready')
    const relocated = deferred<unknown>()
    respond = async config => {
      if (config.url?.endsWith(`/${operation}`)) return relocated.promise
      if (config.url?.endsWith('/save')) throw httpError(config, 500)
      if (config.url?.endsWith('/children')) return { path: config.params.path, children: [] }
      return detail('A')
    }
    const node = { path: 'a.md', name: 'a', suffix: 'md', type: 'file' } as const
    const pending = operation === 'rename'
      ? actions.renameNode(node, 'renamed')
      : actions.moveNode(node, 'folder')
    await until(() => requests.some(request => request.url?.endsWith(`/${operation}`)))
    store.currentFile.content = 'edited while relocating'
    const path = operation === 'rename' ? 'renamed.md' : 'folder/a.md'
    relocated.resolve({ ...node, name: operation === 'rename' ? 'renamed' : 'a', path })
    await pending
    assert.equal(router.currentRoute.value.fullPath, `/file/${path}?mode=read#section`)
    assert.equal(store.currentFile.path, path)
    assert.equal(store.currentFile.content, 'edited while relocating')
    assert.equal(store.isCurrentFileDirty, true)
    assert.equal(requests.some(request => request.url?.endsWith('/save')), false)
    // A real file switch must still save and must be cancelled when that save fails.
    assert.ok(await router.push('/file/b.md'))
    assert.equal(router.currentRoute.value.path, `/file/${path}`)
    const save = requests.find(request => request.url?.endsWith('/save'))!
    assert.equal(JSON.parse(save.data).filepath, path)
  })
}

for (const defaultRevisionId of [null, 'parent-revision']) {
  for (const returnToSamePath of [false, true]) {
    test(`late history deletion cannot affect ${returnToSamePath ? 'a reopened session' : 'another file'} (default=${defaultRevisionId})`, async () => {
      const router = routerForTest()
      const store = useNodeStore()
      const deleted = deferred<unknown>()
      respond = async config => {
        if (config.method === 'delete') return deleted.promise
        if (config.url?.endsWith('/revision')) return { content: 'old revision' }
        return { ...detail(config.params.filepath), history_enabled: true, default_revision_id: 'latest' }
      }
      await router.push('/file/a.md')
      await until(() => store.currentFileStatus === 'ready')
      const pending = store.deleteHistoryRevision('root-revision')
      await until(() => requests.some(request => request.method === 'delete'))
      await router.push('/file/b.md')
      await until(() => store.currentFileStatus === 'ready')
      if (returnToSamePath) {
        await router.push('/file/a.md')
        await until(() => store.currentFileStatus === 'ready')
      }
      const path = returnToSamePath ? 'a.md' : 'b.md'
      store.currentFile.content = 'new session draft'
      const file = store.currentFile
      const requestCount = requests.length
      deleted.resolve({ nodes: [], default_revision_id: defaultRevisionId })
      await pending
      assert.equal(router.currentRoute.value.path, `/file/${path}`)
      assert.equal(store.currentFile, file)
      assert.equal(store.currentFile.content, 'new session draft')
      assert.equal(store.currentFileStatus, 'ready')
      assert.equal(store.isCurrentFileDirty, true)
      assert.equal(store.pendingRevisionId, null)
      assert.equal(store.defaultRevisionId, 'latest')
      assert.equal(requests.length, requestCount)
    })
  }
}

for (const defaultRevisionId of [null, 'parent-revision']) {
  test(`history deletion in the active session reloads the correct content (default=${defaultRevisionId})`, async () => {
    const router = routerForTest()
    const store = useNodeStore()
    respond = async config => {
      if (config.method === 'delete') return { nodes: [], default_revision_id: defaultRevisionId }
      if (config.url?.endsWith('/revision')) return { content: 'parent content' }
      return detail('disk content')
    }
    await router.push('/file/a.md')
    await until(() => store.currentFileStatus === 'ready')
    store.selectItem({ path: 'folder', name: 'folder', suffix: '', type: 'dir' })
    await store.deleteHistoryRevision('old-revision')
    assert.equal(router.currentRoute.value.path, '/file/a.md')
    assert.equal(store.currentFile.content, defaultRevisionId ? 'parent content' : 'disk content')
    assert.equal(store.currentFileStatus, 'ready')
    assert.equal(store.selectedItem?.path, 'folder')
  })
}

test('a late revision response cannot restore content after leaving and reopening the same file', async () => {
  const router = routerForTest()
  const store = useNodeStore()
  const revision = deferred<unknown>()
  respond = async config => config.url?.endsWith('/revision') ? revision.promise : detail('disk content')
  await router.push('/file/a.md')
  await until(() => store.currentFileStatus === 'ready')
  const pending = store.selectHistoryRevision('old-revision')
  await until(() => store.currentFileStatus === 'loading')
  await router.push('/file/b.md')
  await until(() => store.currentFileStatus === 'ready')
  await router.push('/file/a.md')
  await until(() => store.currentFileStatus === 'ready')
  store.currentFile.content = 'new draft'
  revision.resolve({ content: 'old content' })
  await pending
  assert.equal(store.currentFile.content, 'new draft')
  assert.equal(store.currentFileStatus, 'ready')
  assert.equal(store.pendingRevisionId, null)
})

test('renaming during an initial read reloads the new path and ignores the old response', async () => {
  const router = routerForTest()
  const actions = actionsForTest(router)
  const store = useNodeStore()
  const oldRead = deferred<unknown>()
  respond = async config => {
    if (config.url?.endsWith('/load')) {
      return config.params.filepath === 'a.md' ? oldRead.promise : detail('new path content')
    }
    return null
  }
  await router.push('/file/a.md')
  await until(() => requests.some(request => request.url?.endsWith('/load')))
  await actions.renameNode({ path: 'a.md', name: 'a', suffix: 'md', type: 'file' }, 'renamed')
  await until(() => store.currentFileStatus === 'ready')
  oldRead.resolve(detail('stale content'))
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(router.currentRoute.value.path, '/file/renamed.md')
  assert.equal(store.currentFile.path, 'renamed.md')
  assert.equal(store.currentFile.content, 'new path content')
  assert.equal(store.selectedItem?.path, 'renamed.md')
})

test('late save completion cannot change a reopened session of the same path', async () => {
  const store = useNodeStore()
  await store.loadFile('a.md')
  store.currentFile.content = 'old edit'
  const saved = deferred<unknown>()
  respond = async config => config.url?.endsWith('/save') ? saved.promise : detail('disk content')
  const pending = store.saveCurrentFile()
  await until(() => store.isSavePending())
  store.showWelcome()
  await store.loadFile('a.md')
  store.currentFile.content = 'old edit'
  saved.resolve({ history_enabled: true, revision_id: 'old-save', default_revision_id: 'old-save' })
  await pending
  assert.equal(store.isCurrentFileDirty, true)
  assert.equal(store.defaultRevisionId, null)
  assert.equal(store.currentFileStatus, 'ready')
})
