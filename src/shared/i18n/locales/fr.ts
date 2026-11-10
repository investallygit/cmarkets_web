import account from './fr/account.json'
import admin from './fr/admin.json'
import analysis from './fr/analysis.json'
import core from './fr/core.json'
import dataAdmin from './fr/dataAdmin.json'
import home from './fr/home.json'
import messaging from './fr/messaging.json'
import monitoring from './fr/monitoring.json'
import network from './fr/network.json'
import newsStudio from './fr/newsStudio.json'
import portfolio from './fr/portfolio.json'
import research from './fr/research.json'

/** The French strings: the same area files as en.ts, in ./fr. */
const fr = {
  ...core,
  ...home,
  ...account,
  ...monitoring,
  ...analysis,
  ...portfolio,
  ...research,
  ...network,
  ...newsStudio,
  ...messaging,
  ...dataAdmin,
  ...admin,
}

export default fr
