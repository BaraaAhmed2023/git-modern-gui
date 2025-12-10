export const formatDistanceToNow = (date, options = {}) => {
  const now = new Date()
  const diff = now - date
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (options.addSuffix) {
    if (seconds < 60) {
      return 'just now'
    } else if (minutes < 60) {
      return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
    } else if (hours < 24) {
      return `${hours} hour${hours === 1 ? '' : 's'} ago`
    } else if (days < 7) {
      return `${days} day${days === 1 ? '' : 's'} ago`
    } else if (days < 30) {
      const weeks = Math.floor(days / 7)
      return `${weeks} week${weeks === 1 ? '' : 's'} ago`
    } else if (days < 365) {
      const months = Math.floor(days / 30)
      return `${months} month${months === 1 ? '' : 's'} ago`
    } else {
      const years = Math.floor(days / 365)
      return `${years} year${years === 1 ? '' : 's'} ago`
    }
  }

  if (seconds < 60) return `${seconds} seconds`
  if (minutes < 60) return `${minutes} minutes`
  if (hours < 24) return `${hours} hours`
  if (days < 7) return `${days} days`
  if (days < 30) return `${Math.floor(days / 7)} weeks`
  if (days < 365) return `${Math.floor(days / 30)} months`
  return `${Math.floor(days / 365)} years`
}

export const formatDate = (date, format = 'medium') => {
  const d = new Date(date)
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }

  if (format === 'short') {
    return d.toLocaleDateString()
  } else if (format === 'long') {
    return d.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } else {
    return d.toLocaleDateString(undefined, options)
  }
}