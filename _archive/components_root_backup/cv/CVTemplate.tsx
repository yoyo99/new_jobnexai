import { motion } from 'framer-motion'

interface TemplateProps {
  template: {
    id: string
    name: string
    description: string
    category: string
  }
  onSelect: () => void
}

export function CVTemplate({ template, onSelect }: TemplateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 rounded-lg overflow-hidden hover:bg-white/10 transition-colors cursor-pointer"
      onClick={onSelect}
    >
      <div className="aspect-[3/4] bg-white/5">
        {/* Template preview image would go here */}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-medium text-white">{template.name}</h3>
        <p className="text-sm text-gray-400 mt-1">{template.description}</p>
        <div className="mt-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-600/20 text-primary-400">
            {template.category}
          </span>
        </div>
      </div>
    </motion.div>
  )
}