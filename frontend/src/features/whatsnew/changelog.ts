import entries from './changelog.json'

export const CHANGELOG_SECTION_TYPES = ['new', 'improved', 'fixed'] as const

export type ChangelogSectionType = (typeof CHANGELOG_SECTION_TYPES)[number]

export interface ChangelogSection {
    type: ChangelogSectionType
    items: Record<string, string[]>
}

export interface ChangelogEntry {
    version: string
    date: string
    sections: ChangelogSection[]
}

export const CHANGELOG = entries as ChangelogEntry[]

export function entryForVersion(version: string | null): ChangelogEntry | undefined {
    return version === null ? undefined : CHANGELOG.find((entry) => entry.version === version)
}

export function findEntry(version: string | null): ChangelogEntry | undefined {
    return entryForVersion(version) ?? CHANGELOG[0]
}

export function sectionItems(section: ChangelogSection, language: string): string[] {
    return section.items[language] ?? section.items.en ?? []
}
