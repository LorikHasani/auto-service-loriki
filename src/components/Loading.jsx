export const Loading = ({ fullScreen = false }) => {
  if (fullScreen) {
    return (
      <div className="min-h-screen bg-dark-500 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-sm text-gray-400">Duke ngarkuar...</p>
        </div>
      </div>
    )
  }
  return (
    <div className="flex items-center justify-center p-12">
      <div className="w-8 h-8 border-3 border-primary-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export const EmptyState = ({ title, description, action }) => {
  return (
    <div className="text-center py-16">
      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
        <span className="text-xl text-gray-400">∅</span>
      </div>
      <h3 className="text-sm font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 mb-6">{description}</p>
      {action}
    </div>
  )
}
