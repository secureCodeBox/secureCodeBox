# From: http://support.arachni-scanner.com/discussions/questions/13047-create-logon-script-for-angularjs

# Extract the JWT auth token and set it system-wide.
http.on_complete do |response|
    request = response.request
    next if !request.headers['Authorization']

    http.headers['Authorization'] = request.headers['Authorization']
end

browser.goto 'https://juice-shop/#/login'

browser.button( id: 'loginButton' ).wait_until_present( 30 )

browser.text_field( id: 'userEmail' ).set 'jim@juice-sh.op'
browser.text_field( id: 'userPassword' ).set 'ncc-1701'

browser.button( id: 'loginButton' ).click

browser.element( css: 'a[href="#/logout"]' ).wait_until_present

framework.options.session.check_url = "https://juice-shop/rest/basket/4"
framework.options.session.check_pattern = "success"