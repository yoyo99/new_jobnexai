import { Fragment, useEffect, useRef } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'
import Player from '@vimeo/player'

interface VideoModalProps {
  isOpen: boolean
  onClose: () => void
}

export function VideoModal({ isOpen, onClose }: VideoModalProps) {
  const { t } = useTranslation()
  const playerRef = useRef<Player | null>(null)

  useEffect(() => {
    if (isOpen && !playerRef.current) {
      playerRef.current = new Player('vimeo-player', {
        id: 123456789, // Replace with your Vimeo video ID
        width: 800,
        loop: false,
        autoplay: true,
      })

      playerRef.current.on('ended', () => {
        onClose()
      })
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy()
        playerRef.current = null
      }
    }
  }, [isOpen, onClose])

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/75" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="relative w-full max-w-4xl overflow-hidden rounded-lg bg-background shadow-xl">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 z-10 text-gray-400 hover:text-white"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>

                <div className="aspect-video">
                  <div id="vimeo-player" className="w-full h-full" />
                </div>

                <div className="p-6">
                  <Dialog.Title as="h3" className="text-lg font-medium text-white">
                    {t('hero.watchDemo')}
                  </Dialog.Title>
                  <p className="mt-2 text-sm text-gray-400">
                    {t('demo.description')}
                  </p>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}