const UUID_REF_RE =
  /\[\[([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\]\]/gi

interface RefLike {
  uuid?: string
  title?: string
  'full-title'?: string
}

export function resolveTitleRefs(
  title: string | undefined,
  refs: unknown,
): string {
  if (!title) return ''
  if (!Array.isArray(refs) || refs.length === 0) return title
  const map = new Map<string, string>()
  for (const r of refs as RefLike[]) {
    const uuid = r?.uuid
    const refTitle = r?.['full-title'] ?? r?.title
    if (uuid && refTitle) map.set(uuid, refTitle)
  }
  if (map.size === 0) return title
  return title.replace(UUID_REF_RE, (m, id) => {
    const t = map.get(id)
    return t ? `[[${t}]]` : m
  })
}
