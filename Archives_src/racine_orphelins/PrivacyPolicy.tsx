import { useTranslation } from 'react-i18next'

export function PrivacyPolicy() {
  const { t } = useTranslation()

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="prose prose-invert max-w-none">
        <h1>{t('privacy.title')}</h1>
        
        <h2>{t('privacy.dataCollection.title')}</h2>
        <p>{t('privacy.dataCollection.description')}</p>
        <ul>
          <li>{t('privacy.dataCollection.personal')}</li>
          <li>{t('privacy.dataCollection.preferences')}</li>
          <li>{t('privacy.dataCollection.skills')}</li>
          <li>{t('privacy.dataCollection.usage')}</li>
        </ul>

        <h2>{t('privacy.dataPurpose.title')}</h2>
        <p>{t('privacy.dataPurpose.description')}</p>
        <ul>
          <li>{t('privacy.dataPurpose.matching')}</li>
          <li>{t('privacy.dataPurpose.recommendations')}</li>
          <li>{t('privacy.dataPurpose.analytics')}</li>
        </ul>

        <h2>{t('privacy.dataRetention.title')}</h2>
        <p>{t('privacy.dataRetention.description')}</p>
        <ul>
          <li>{t('privacy.dataRetention.preferences')}</li>
          <li>{t('privacy.dataRetention.skills')}</li>
          <li>{t('privacy.dataRetention.logs')}</li>
        </ul>

        <h2>{t('privacy.security.title')}</h2>
        <p>{t('privacy.security.description')}</p>
        <ul>
          <li>{t('privacy.security.encryption')}</li>
          <li>{t('privacy.security.access')}</li>
          <li>{t('privacy.security.monitoring')}</li>
          <li>{t('privacy.security.compliance')}</li>
        </ul>

        <h2>{t('privacy.rights.title')}</h2>
        <p>{t('privacy.rights.description')}</p>
        <ul>
          <li>{t('privacy.rights.access')}</li>
          <li>{t('privacy.rights.rectification')}</li>
          <li>{t('privacy.rights.erasure')}</li>
          <li>{t('privacy.rights.portability')}</li>
          <li>{t('privacy.rights.withdraw')}</li>
        </ul>

        <h2>{t('privacy.contact.title')}</h2>
        <p>{t('privacy.contact.description')}</p>
      </div>
    </div>
  )
}