import account from './en/account.json'
import admin from './en/admin.json'
import analysis from './en/analysis.json'
import bonds from './en/bonds.json'
import core from './en/core.json'
import dataAdmin from './en/dataAdmin.json'
import etfs from './en/etfs.json'
import home from './en/home.json'
import macro from './en/macro.json'
import messaging from './en/messaging.json'
import monitoring from './en/monitoring.json'
import network from './en/network.json'
import newsAdmin from './en/newsAdmin.json'
import newsStudio from './en/newsStudio.json'
import payments from './en/payments.json'
import portfolio from './en/portfolio.json'
import research from './en/research.json'
import subscriptions from './en/subscriptions.json'

/**
 * The English strings, one file per area of the app in ./en: the shell and the shared UI (core),
 * the home page, login and settings (account), the client screens, then the Data admin's and the
 * Admin's. fr.ts has the same files with the same keys; a top-level key lives in one file only.
 */
const en = {
  ...core,
  ...home,
  ...account,
  ...monitoring,
  ...analysis,
  ...bonds,
  ...etfs,
  ...macro,
  ...portfolio,
  ...research,
  ...network,
  ...newsStudio,
  ...newsAdmin,
  ...payments,
  ...messaging,
  ...dataAdmin,
  ...admin,
  ...subscriptions,
}

export default en
