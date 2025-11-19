import { Dialog } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import {
  FacebookShareButton,
  TwitterShareButton,
  LinkedinShareButton,
  WhatsappShareButton,
  EmailShareButton,
  FacebookIcon,
  TwitterIcon,
  LinkedinIcon,
  WhatsappIcon,
  EmailIcon,
} from 'react-share'
import type { Job } from '../lib/supabase'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  job: Job
}

export function ShareModal({ isOpen, onClose, job }: ShareModalProps) {
  const shareUrl = job.url
  const title = `${job.title} chez ${job.company}`
  const description = `Découvrez cette offre d'emploi : ${job.title} chez ${job.company}`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      // On pourrait ajouter une notification de succès ici
    } catch (error) {
      console.error('Failed to copy link:', error)
    }
  }

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/75" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md rounded-lg bg-background p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-lg font-medium text-white">
              Partager cette offre
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-6">
            <div className="flex justify-center gap-4">
              <FacebookShareButton url={shareUrl} hashtag="#emploi">
                <FacebookIcon size={40} round />
              </FacebookShareButton>

              <TwitterShareButton url={shareUrl} title={title}>
                <TwitterIcon size={40} round />
              </TwitterShareButton>

              <LinkedinShareButton url={shareUrl} title={title} summary={description}>
                <LinkedinIcon size={40} round />
              </LinkedinShareButton>

              <WhatsappShareButton url={shareUrl} title={title}>
                <WhatsappIcon size={40} round />
              </WhatsappShareButton>

              <EmailShareButton url={shareUrl} subject={title} body={description}>
                <EmailIcon size={40} round />
              </EmailShareButton>
            </div>

            <div>
              <p className="text-sm text-gray-400 mb-2">Ou copier le lien</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                />
                <button
                  onClick={handleCopyLink}
                  className="btn-primary whitespace-nowrap"
                >
                  Copier
                </button>
              </div>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}