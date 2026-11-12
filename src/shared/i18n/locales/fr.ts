import account from './fr/account.json'
import admin from './fr/admin.json'
import analysis from './fr/analysis.json'
import bonds from './fr/bonds.json'
import core from './fr/core.json'
import dataAdmin from './fr/dataAdmin.json'
import etfs from './fr/etfs.json'
import home from './fr/home.json'
import messaging from './fr/messaging.json'
import monitoring from './fr/monitoring.json'
import network from './fr/network.json'
import newsAdmin from './fr/newsAdmin.json'
import newsStudio from './fr/newsStudio.json'
import payments from './fr/payments.json'
import portfolio from './fr/portfolio.json'
import research from './fr/research.json'
import subscriptions from './fr/subscriptions.json'

/** The French strings: the same area files as en.ts, in ./fr. */
const fr = {
  ...core,
  ...home,
  ...account,
  ...monitoring,
  ...analysis,
  ...bonds,
  ...etfs,
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

export default fr
