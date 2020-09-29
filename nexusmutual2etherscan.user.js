// ==UserScript==
// @name         nexusmutual2etherscan
// @namespace    https://app.nexusmutual.io/
// @version      0.1
// @description  Request catcher and form filler
// @author       johnnykramer
// @match        *://app.nexusmutual.io/cover/*
// @match        *://etherscan.io/address/0x181aea6936b407514ebfc0754a37704eb8d98f91*
// @match        *://etherscan.io/writecontract/index.html*
// @grant        GM_webRequest
// @require      http://code.jquery.com/jquery-3.4.1.min.js
// @downloadURL  https://github.com/zu-ctrl/userscripts/raw/master/nexusmutual2etherscan.user.js
// @updateURL    https://github.com/zu-ctrl/userscripts/raw/master/nexusmutual2etherscan.user.js
// ==/UserScript==

;(function () {
  if (window.location.href.includes('app.nexusmutual.io/cover/')) {
    console.log('STEP 1')
    const oldFetch = this.fetch
    this.fetch = async (...args) => {
      const response = await oldFetch(...args)
      if (response.url.includes('https://api.nexusmutual.io/v1/quote')) {
        const clonedResponse = response.clone()
        const jsonBody = await clonedResponse.json()
        window.open(
          `https://etherscan.io/address/0x181aea6936b407514ebfc0754a37704eb8d98f91?nexusmutual2etherscan=${JSON.stringify(
            jsonBody
          )}#writeContract`,
          '_blank'
        )
      }
      return response
    }
  } else if (window.location.href.includes('etherscan.io/writecontract/index.html')) {
    console.log('STEP 2')
    const queryData = getParentQueryVariable('nexusmutual2etherscan')
    const parsedData = JSON.parse(queryData)
    if (parsedData.error && parsedData.message) return console.error('[nexusmutual2etherscan]', parsedData.message)
    setTimeout(() => {
      $('#input_payable_2_buyCover').val(`0.${parsedData.price}`) // buyCover
      $('#input_2_1').val(parsedData.contract) // coveredContractAddress (address)
      $('#input_2_2').val('0x455448') // coverCurrency (bytes4)
      $('#input_2_3').val(
        `${parsedData.amount},${parsedData.price},${parsedData.priceInNXM},${parsedData.expiresAt},${parsedData.generatedAt}`
      ) // coverDetails (uint256[])
      $('#input_2_4').val(parsedData.contract) // coverPeriod (uint16)
      $('#input_2_5').val(parsedData.v) // _v (uint8)
      $('#input_2_6').val(parsedData.r) // _r (bytes32)
      $('#input_2_7').val(parsedData.s) // _s (bytes32)
    }, 5000)
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
})()
