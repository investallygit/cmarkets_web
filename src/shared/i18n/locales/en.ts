import account from './en/account.json'
import admin from './en/admin.json'
import analysis from './en/analysis.json'
import core from './en/core.json'
import dataAdmin from './en/dataAdmin.json'
import home from './en/home.json'
import monitoring from './en/monitoring.json'
import network from './en/network.json'
import portfolio from './en/portfolio.json'
import research from './en/research.json'

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
  ...portfolio,
  ...research,
  ...network,
  ...dataAdmin,
  ...admin,
}

export default en
