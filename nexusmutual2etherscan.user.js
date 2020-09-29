// ==UserScript==
// @name         nexusmutual2etherscan
// @namespace    https://app.nexusmutual.io/
// @version      0.5
// @description  Request catcher and form filler
// @author       johnnykramer
// @match        *://app.nexusmutual.io/cover/*
// @match        *://etherscan.io/address/0x181aea6936b407514ebfc0754a37704eb8d98f91*
// @match        *://etherscan.io/writecontract/index.html*
// @grant        none
// @require      http://code.jquery.com/jquery-3.4.1.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/bignumber.js/8.0.2/bignumber.min.js
// @downloadURL  https://github.com/zu-ctrl/userscripts/raw/master/nexusmutual2etherscan.user.js
// @updateURL    https://github.com/zu-ctrl/userscripts/raw/master/nexusmutual2etherscan.user.js
// ==/UserScript==

;(function (window, $) {
  /**
   * CONSTANTS
   */
  const N_2_E = 'nexusmutual2etherscan'
  const STEP_1_URL = 'app.nexusmutual.io/cover/'
  const STEP_1_TARGET_REQUEST_URL = 'https://api.nexusmutual.io/v1/quote'
  const STEP_1_REDIRECT_BASE_URL = 'https://etherscan.io/address/0x181aea6936b407514ebfc0754a37704eb8d98f91'
  const STEP_2_URL = 'etherscan.io/writecontract/index.html'
  const COVER_CURR_BYTES_4 = '0x455448'
  const NO_DATA_ERR = 'No data to process'

  /**
   * RUNTIME
   */
  try {
    if (window.location.href.includes(STEP_1_URL)) step1()
    if (window.location.href.includes(STEP_2_URL)) step2()
  } catch (e) {
    return console.error(`[${N_2_E}] ${e.message}`)
  }

  /**
   * HELPERS
   */
  function step1() {
    console.log(`${N_2_E} STEP 1`)
    const oldFetch = this.fetch
    this.fetch = async (...args) => {
      const response = await oldFetch(...args)
      if (response.url.includes(STEP_1_TARGET_REQUEST_URL)) {
        const clonedResponse = response.clone()
        const jsonBody = await clonedResponse.json()
        if (!validateParams(jsonBody) || (jsonBody.error && jsonBody.message)) {
          console.error(`[${N_2_E}] ${jsonBody.message}`)
        } else {
          window.open(`${STEP_1_REDIRECT_BASE_URL}?${N_2_E}=${JSON.stringify(jsonBody)}#writeContract`, '_blank')
        }
      }
      return response
    }
  }

  function step2() {
    console.log(`${N_2_E} STEP 2`)
    const queryData = getParentQueryVariable(N_2_E)
    if (!queryData) return console.error(`[${N_2_E}] ${NO_DATA_ERR}`)
    const parsedData = JSON.parse(queryData)
    setContractFields(parsedData)
  }

  function setContractFields(obj) {
    waitForEl('#input_payable_2_buyCover', ($el) => $el.val(convert(obj.price))) // buyCover
    waitForEl('#input_2_1', ($el) => $el.val(obj.contract)) // coveredContractAddress (address)
    waitForEl('#input_2_2', ($el) => $el.val(COVER_CURR_BYTES_4)) // coverCurrency (bytes4)
    waitForEl('#input_2_3', ($el) =>
      $el.val(`${obj.amount},${obj.price},${obj.priceInNXM},${obj.expiresAt},${obj.generatedAt}`)
    ) // coverDetails (uint256[])
    waitForEl('#input_2_4', ($el) => $el.val(obj.period)) // coverPeriod (uint16)
    waitForEl('#input_2_5', ($el) => $el.val(obj.v)) // _v (uint8)
    waitForEl('#input_2_6', ($el) => $el.val(obj.r)) // _r (bytes32)
    waitForEl('#input_2_7', ($el) => $el.val(obj.s)) // _s (bytes32)
  }

  function validateParams(obj) {
    if (
      !obj.amount ||
      !obj.contract ||
      !obj.price ||
      !obj.priceInNXM ||
      !obj.expiresAt ||
      !obj.generatedAt ||
      !obj.period ||
      !obj.v ||
      !obj.r ||
      !obj.s
    ) {
      return false
    } else {
      return true
    }
  }

  function getParentQueryVariable(variable) {
    var query = window.parent.location.search.substring(1)
    var vars = query.split('&')
    for (var i = 0; i < vars.length; i++) {
      var pair = vars[i].split('=')
      if (decodeURIComponent(pair[0]) == variable) {
        return decodeURIComponent(pair[1])
      }
    }
    return undefined
  }

  function waitForEl(selector, cb) {
    if ($(selector).length) {
      cb($(selector))
    } else {
      setTimeout(() => {
        waitForEl(selector, cb)
      }, 100)
    }
  }

  function convert(weiVal) {
    var i = new BigNumber(weiVal)
    return (i = i.times(new BigNumber('0.000000000000000001'))).times(new BigNumber('1')).toString()
  }
})(window, $)
