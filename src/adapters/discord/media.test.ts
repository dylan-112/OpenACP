import { describe, it, expect, vi, afterEach } from 'vitest'
import { buildFallbackText, isAttachmentTooLarge, downloadDiscordAttachment } from './media.js'

describe('buildFallbackText', () => {
  it('generates text from single attachment', () => {
    expect(buildFallbackText([{ type: 'image', fileName: 'photo.png' }]))
      .toBe('[Photo: photo.png]')
  })

  it('generates text from audio attachment', () => {
    expect(buildFallbackText([{ type: 'audio', fileName: 'voice.wav' }]))
      .toBe('[Audio: voice.wav]')
  })

  it('generates text from file attachment', () => {
    expect(buildFallbackText([{ type: 'file', fileName: 'doc.pdf' }]))
      .toBe('[File: doc.pdf]')
  })

  it('joins multiple attachments', () => {
    const result = buildFallbackText([
      { type: 'image', fileName: 'a.png' },
      { type: 'file', fileName: 'b.pdf' },
    ])
    expect(result).toBe('[Photo: a.png] [File: b.pdf]')
  })
})

describe('isAttachmentTooLarge', () => {
  it('returns false for files under 25MB', () => {
    expect(isAttachmentTooLarge(1024)).toBe(false)
    expect(isAttachmentTooLarge(25 * 1024 * 1024)).toBe(false)
  })

  it('returns true for files over 25MB', () => {
    expect(isAttachmentTooLarge(25 * 1024 * 1024 + 1)).toBe(true)
    expect(isAttachmentTooLarge(50 * 1024 * 1024)).toBe(true)
  })
})

describe('downloadDiscordAttachment', () => {
  const originalFetch = globalThis.fetch

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('returns null on 404', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    }) as unknown as typeof fetch

    const result = await downloadDiscordAttachment('https://cdn.example.com/file.png', 'file.png')
    expect(result).toBeNull()
  })

  it('returns null on network error', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error')) as unknown as typeof fetch

    const result = await downloadDiscordAttachment('https://cdn.example.com/file.png', 'file.png')
    expect(result).toBeNull()
  })

  it('returns buffer on success', async () => {
    const fakeData = new Uint8Array([1, 2, 3])
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(fakeData.buffer),
    }) as unknown as typeof fetch

    const result = await downloadDiscordAttachment('https://cdn.example.com/file.png', 'file.png')
    expect(result).toBeInstanceOf(Buffer)
    expect(result!.length).toBe(3)
  })
})
