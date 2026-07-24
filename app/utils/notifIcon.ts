export function getIcon(type: string) {
    switch (type) {
        case 'like': return 'bi-heart-fill'
        case 'comment': return 'bi-chat-square-text-fill'
        case 'reply': return 'bi-arrow-return-right'
        case 'repost': return 'bi-repeat'
        case 'follow': return 'bi-person-check-fill'
        case 'follow_request': return 'bi-person-plus-fill'
        case 'follow_accept': return 'bi-check-circle-fill'
        case 'mention': return 'bi-at'
        default: return 'bi-bell-fill'
    }
}
export function getIconColor(type: string) {
    switch (type) {
        case 'like': return 'text-rose-500'
        case 'comment': return 'text-sky-500'
        case 'reply': return 'text-emerald-500'
        case 'repost': return 'text-blue-500'
        case 'follow': return 'text-violet-500'
        case 'follow_request': return 'text-amber-500'
        case 'follow_accept': return 'text-emerald-400'
        case 'mention': return 'text-cyan-400'
        default: return 'text-purple-300'
    }
}
