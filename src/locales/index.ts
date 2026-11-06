import { createI18n } from 'vue-i18n'
import { resolveLocale } from './locale'
import { en as errorsHandlerEn, ptBr as errorsHandlerPtBr } from './utils/errorsHandler'
import { en as validatorsEn, ptBr as validatorsPtBr } from './utils/validators'
import authEn from './auth/en'
import authPtBr from './auth/pt-BR'
import commonEn from './common/en'
import commonPtBr from './common/pt-BR'
import projectEn from './project/en'
import projectPtBr from './project/pt-BR'
import userEn from './user/en'
import userPtBr from './user/pt-BR'

const locale = resolveLocale()

const i18n = createI18n({
  legacy: false,
  locale,
  fallbackLocale: 'en',
  messages: {
    en: {
      ...commonEn,
      auth: authEn,
      project: projectEn,
      user: userEn,
      utils: {
        validators: validatorsEn,
        errorsHandler: errorsHandlerEn,
      },
    },
    'pt-BR': {
      ...commonPtBr,
      auth: authPtBr,
      project: projectPtBr,
      user: userPtBr,
      utils: {
        validators: validatorsPtBr,
        errorsHandler: errorsHandlerPtBr,
      },
    },
  },
})

export default i18n
