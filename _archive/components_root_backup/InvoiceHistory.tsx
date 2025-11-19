import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../stores/auth'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline'

interface Invoice {
  id: string
  number: string
  amount_paid: number
  currency: string
  status: string
  created: number
  hosted_invoice_url: string
  pdf: string
}

export function InvoiceHistory() {
  const { user } = useAuth()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadInvoices()
    }
  }, [user])

  const loadInvoices = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase.functions.invoke('list-invoices', {
        body: { userId: user?.id }
      })

      if (error) throw error
      setInvoices(data || [])
    } catch (error: any) {
      console.error('Error loading invoices:', error)
      setError(error.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-400"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-white">Historique des factures</h3>

      {error && (
        <div className="bg-red-900/50 text-red-400 p-4 rounded-lg">
          {error}
        </div>
      )}

      {invoices.length === 0 ? (
        <div className="bg-white/5 rounded-lg p-6 text-center">
          <p className="text-gray-400">Aucune facture disponible</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Numéro
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {invoice.number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {format(new Date(invoice.created * 1000), 'dd MMMM yyyy', { locale: fr })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {formatCurrency(invoice.amount_paid, invoice.currency)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      invoice.status === 'paid' ? 'bg-green-900/50 text-green-400' :
                      invoice.status === 'open' ? 'bg-yellow-900/50 text-yellow-400' :
                      'bg-red-900/50 text-red-400'
                    }`}>
                      {invoice.status === 'paid' ? 'Payée' :
                       invoice.status === 'open' ? 'En attente' :
                       'Non payée'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <div className="flex justify-end gap-2">
                      <a
                        href={invoice.hosted_invoice_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-400 hover:text-primary-300"
                      >
                        Voir
                      </a>
                      <a
                        href={invoice.pdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-400 hover:text-primary-300 flex items-center gap-1"
                      >
                        <DocumentArrowDownIcon className="h-4 w-4" />
                        PDF
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}