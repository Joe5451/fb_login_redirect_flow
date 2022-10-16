var express = require('express');
var router = express.Router();
var request = require('request');
const clientId = '...';
const clientSecret = '...';

/* GET home page. */
router.get('/', function(req, res, next) {
	res.redirect('/login');
});

/* GET login page. */
router.get('/login', function(req, res, next) {
    const login_state = parseInt(req.cookies.login_state);

	if (login_state === 1)
        res.redirect('/user_info');
	else
    	res.render('login', { title: 'Facebook Login' });
});

/* GET login page. */
router.get('/fb_login', function(req, res, next) {
    let fb_login_url = 'https://www.facebook.com/v15.0/dialog/oauth?';
    fb_login_url += 'client_id=' + clientId;
    fb_login_url += '&redirect_uri=' + 'http://localhost/fb_back';
    fb_login_url += '&state=' + 'dev';
    fb_login_url += '&scope=' + 'email,public_profile';

    res.redirect(fb_login_url);
});

/* Facebook redirect uri */
router.get('/fb_back', function(req, res, next) {
    const code = req.query.code;
    const state = req.query.state;

    if (state !== 'dev') {
        res.redirect('/login');
        return;
    }

    let fb_access_token_url = 'https://graph.facebook.com/oauth/access_token?';
    fb_access_token_url += 'client_id=' + clientId;
    fb_access_token_url += '&client_secret=' + clientSecret;
    fb_access_token_url += '&redirect_uri=' + 'http://localhost/fb_back';
    fb_access_token_url += '&code=' + code;

    let token_option = {
        url: fb_access_token_url,
        method: 'GET'
    };

    request(token_option, function(err, response, body) {
        const user_token = JSON.parse(body).access_token;

        request({ url: 'https://graph.facebook.com/me?fields=id,name,email,birthday,first_name,last_name,picture&access_token=' + user_token }, function(err, response, body) {
            if (err) {
                res.send(err);
            } else {
                res.cookie('login_state', 1);
                res.cookie('user_token', user_token);
                res.cookie('user_info', body);
                res.redirect("/user_info");
            }
        });
    });
});

/* User Info Page */
router.get('/user_info', function(req, res, next) {
    let login_state = parseInt(req.cookies.login_state);
    let user_token = req.cookies.user_token;
    let user_info = req.cookies.user_info;

    if (user_info !== undefined) {
        user_info = JSON.parse(user_info);
    }

    if (login_state !== 1 || user_token === undefined) {
        res.clearCookie('login_state');
        res.redirect('/login');
        return;
    }

    if (user_info.id === undefined || user_info.name === undefined || user_info.email === undefined) {
        res.cookie('login_state', 0);
        res.redirect('/login');
        return;
    }

    res.render('user_info', { title: '登入者頁面', ...user_info });
});

router.get('/logout', function(req, res, next) {
    let user_token = req.cookies.user_token;

    let token_option = {
        url: `https://graph.facebook.com/v15.0/me/permissions?access_token=${user_token}`,
        method: 'DELETE'
    };

    request(token_option, function(err, response, body) {
        if (JSON.parse(body).success === true) {
            res.clearCookie('login_state');
            res.clearCookie('user_token');
            res.clearCookie('user_info');
            res.redirect('/login');
        } else {
            res.redirect('/user_info');
        }
    })
});

/* get fb app tokens */
router.get('/fb_app_token', function(req, res, next) {
    let fb_app_token_url = 'https://graph.facebook.com/v15.0/oauth/access_token?';
    fb_app_token_url += 'client_id=' + clientId;
    fb_app_token_url += '&client_secret=' + clientSecret;
    fb_app_token_url += '&grant_type=client_credentials';

    res.redirect(fb_app_token_url);
    // {"access_token":"...","token_type":"bearer"}
});

module.exports = router;
