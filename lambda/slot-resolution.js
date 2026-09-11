/** Resolve custom slots without assuming Alexa supplied a value or a match. */
export function resolveSlot(slot, { requireId = false } = {}) {
    if (!slot?.value) return { status: 'missing' };
    const authorities = slot.resolutions?.resolutionsPerAuthority ?? [];
    const matches = authorities.filter(authority => authority.status?.code === 'ER_SUCCESS_MATCH');
    if (matches.length === 0) {
        return { status: authorities.some(authority => authority.status?.code === 'ER_SUCCESS_NO_MATCH') ? 'unknown' : 'error' };
    }
    const values = matches.flatMap(authority => authority.values ?? []).map(entry => entry.value)
        .filter(value => typeof value?.name === 'string' && value.name.trim() &&
            (!requireId || (typeof value.id === 'string' && value.id.trim())));
    const candidates = [...new Map(values.map(value => [value.id ?? value.name, value])).values()];
    if (candidates.length === 0) return { status: 'error' };
    const normalize = value => value.trim().toLocaleLowerCase('de-DE');
    const exact = candidates.filter(value => normalize(value.name) === normalize(slot.value));
    if (exact.length === 1) return { status: 'matched', value: exact[0] };
    if (candidates.length === 1) return { status: 'matched', value: candidates[0] };
    return { status: 'ambiguous', candidates };
}

export function getElicitSlotPrompt(prefix, values) {
    return prefix + values.map((value, index) => (index === values.length - 1 ? ' oder ' : ', ') + value).join('') + '?';
}
