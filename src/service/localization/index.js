import {closest} from '#core/dom/query';

import {Services} from '#service';

import {
  LocalizedStringBundleDef,
  // The LocalizedStringId_Enum type is imported even though it is not used because
  // the compiler does not output types for enums, but we want to distinguish
  // between LocalizedStringId_Enum enum values and any other strings.
  // eslint-disable-next-line no-unused-vars
  LocalizedStringId_Enum,
} from './strings';

/**
 * Language code used if there is no language code specified by the document.
 * @const {string}
 */
const FALLBACK_LANGUAGE_CODE = 'default';

/**
 * @const {!RegExp}
 */
const LANGUAGE_CODE_CHUNK_REGEX = /\w+/gi;

/**
 * Gets the string matching the specified localized string ID in the language
 * specified.
 * @param {!Object<string, !LocalizedStringBundleDef>} localizedStringBundles
 * @param {!Array<string>} languageCodes
 * @param {!LocalizedStringId_Enum} localizedStringId
 * @return {?string}
 */
function findLocalizedString(
  localizedStringBundles,
  languageCodes,
  localizedStringId
) {
  for (const code of languageCodes) {
    const entry = localizedStringBundles[code]?.[localizedStringId];
    if (entry != null) {
      // In unminified builds, this is an object {"string": "foo", ...}.
      // In minified builds, this is the actual string "foo".
      return entry['string'] || entry;
    }
  }
  return null;
}

/**
 * @param {string} languageCode
 * @return {!Array<string>} A list of language codes.
 * @visibleForTesting
 */
export function getLanguageCodesFromString(languageCode) {
  if (!languageCode) {
    return ['en', FALLBACK_LANGUAGE_CODE];
  }
  const matches = languageCode.match(LANGUAGE_CODE_CHUNK_REGEX) || [];
  return matches.reduce(
    (fallbackLanguageCodeList, chunk, index) => {
      const fallbackLanguageCode = matches
        .slice(0, index + 1)
        .join('-')
        .toLowerCase();
      fallbackLanguageCodeList.unshift(fallbackLanguageCode);
      return fallbackLanguageCodeList;
    },
    [FALLBACK_LANGUAGE_CODE]
  );
}

/**
 * Localization service.
 */
export class LocalizationService {
  /**
   * @param {!Element} element
   */
  constructor(element) {
    this.element_ = element;

    /**
     * @private @const {?string}
     */
    this.viewerLanguageCode_ = Services.viewerForDoc(element).getParam('lang');

    /**
     * A mapping of language code to localized string bundle.
     * @private @const {!Object<string, !LocalizedStringBundleDef>}
     */
    this.localizedStringBundles_ = {};
  }

  /**
   * @param {!Element} element
   * @return {!Array<string>}
   * @private
   */
  getLanguageCodesForElement_(element) {
    const languageEl = closest(element, (el) => el.hasAttribute('lang'));
    const languageCode = languageEl ? languageEl.getAttribute('lang') : null;
    const languageCodesToUse = getLanguageCodesFromString(languageCode || '');

    if (this.viewerLanguageCode_) {
      languageCodesToUse.unshift(this.viewerLanguageCode_);
    }

    return languageCodesToUse;
  }

  /**
   * @param {string} languageCode The language code to associate with the
   *     specified localized string bundle.
   * @param {!LocalizedStringBundleDef} localizedStringBundle
   *     The localized string bundle to register.
   * @return {!LocalizationService} For chaining.
   */
  registerLocalizedStringBundle(languageCode, localizedStringBundle) {
    const normalizedLangCode = languageCode.toLowerCase();
    if (!this.localizedStringBundles_[normalizedLangCode]) {
      this.localizedStringBundles_[normalizedLangCode] = {};
    }

    Object.assign(
      this.localizedStringBundles_[normalizedLangCode],
      localizedStringBundle
    );
    return this;
  }

  /**
   * @param {!LocalizedStringId_Enum} localizedStringId
   * @param {!Element=} elementToUse The element where the string will be
   *     used.  The language is based on the language at that part of the
   *     document.  If unspecified, will use the document-level language, if
   *     one exists, or the default otherwise.
   * @return {?string}
   */
  getLocalizedString(localizedStringId, elementToUse = this.element_) {
    const languageCodes = this.getLanguageCodesForElement_(elementToUse);

    return findLocalizedString(
      this.localizedStringBundles_,
      languageCodes,
      localizedStringId
    );
  }
}
