export function getIcon(type: string) {
    switch (type) {
        case 'like': return 'streamline-ultimate:like-bold'
        case 'comment': return 'streamline-ultimate:messages-bubble-square-typing-bold'
        case 'reply': return 'streamline-ultimate:messages-people-person-bubble-circle-1-bold'
        case 'repost': return 'streamline-ultimate:switch-account-1-bold'
        case 'follow': return 'streamline-ultimate:following-1-bold'
        case 'follow_request': return 'ph:user-plus-bold'
        case 'follow_accept': return 'ph:check-circle-bold'
        default: return 'streamline-ultimate:alert-bell-notification-2-bold'
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
        default: return 'text-purple-300'
    }
}
