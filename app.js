// Application Log
var log4js = require('log4js');
var log4js_extend = require('log4js-extend');
log4js_extend(log4js, {
    path: __dirname,
    format: '(@file:@line:@column)'
});
log4js.configure(__dirname + '/log4js.json');
var logger = log4js.getLogger('assistant');

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var hashtable = require(__dirname + '/hashtable.js');

// Setup Express Server
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.all('*', function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type');
    next();
});

var config = require('fs').readFileSync(__dirname + '/config.json');
config = JSON.parse(config);

app.get('/api', function (request, response) {
    response.send('API is running');
});

app.get('/logs', function (request, response) {
    var stream = require('fs').createReadStream('logs/assistant.log');
    stream.pipe(response);
});

app.post('/api/image_url', function (request, response) {
    console.log(typeof (request.body));
    console.log(request.body);
    var image_url = request.body.data.image_url;
    console.log(image_url);
    var req = require("request");
    var options = {
        url: 'https://tsticomputervisionocrapp.azurewebsites.net/api/OcrOnline?key=87978a6ac7554c11ac65d5a460d3ed39',
        method: 'POST',
        headers: {
            'x-functions-key': 'WXFunMe4piO3z/9ed0TlGS8nsfzpEIcVwxonYGKwGacH4KncUhl6Cg=='
        },
        body: image_url
    };
    req(options, function (error, response, body) {
        if (error) console.log(error);
        var text_to_Json = JSON.parse(body);
        console.log(body);
        var all_text = '';
        var line_text = '';
        var email = '';
        var mobilephone = '';
        var tel = '';
        var fax = '';
        var line_id = '';
        var company = '';
        var company2 = '';
        var address = '';
        var cardname = '';
        var bwidth = 0;
        var bheight = 0;
        var keyname = [];
        var asize = [];
        var wordsize = 0;
        var res_data = {};
        var regions = text_to_Json.regions;
        for (var i = 0; i < regions.length; i++) {
            var lines = regions[i].lines;
            for (var j = 0; j < lines.length; j++) {
                var words = lines[j].words;
                var boundingBox = lines[j].boundingBox;
                boundingBox = JSON.parse('[' + boundingBox + ']');
                bwidth = boundingBox[2];
                bheight = boundingBox[3];
                for (var k = 0; k < words.length; k++) {
                    var text = words[k].text;
                    console.log(k);
                    if (text == "一") {
                        if (k == 0) {
                            //continue;
                        } else {
                            if (!isNaN(Number(words[k - 1].text)) || (words[k - 1].text).indexOf('-') != -1) {
                                text = text.replace('一', '-');
                            }
                        }
                    } /*else if(text.indexOf('@') != -1){
                        if(text.slice(0,1) != '@' && text.indexOf('.') != -1){ //排除LINE ID前面的@
                            email = text;
                        }
                }*/ /*else if((text.toLowerCase()).indexOf('line') != -1){
                        for(var lid=0; lid<words.length;lid++){
                            line_id = line_id+words[lid].text;
                        }
                    }*/
                    line_text = line_text + text;
                }
                var patterntel = new RegExp(/^0(2|3|37|4|49|5|6|7|8|82|89|826|836)\d+(ext|Ext|EXT|ext.|Ext.|EXT.|\#|\-|分機|分机|分|轉|转)\d+/); //
                var patterntelc = new RegExp(/^0(2|3|37|4|49|5|6|7|8|82|89|826|836)\d{7,8},\d{3,4}$/);
                line_text = line_text.replace('-', '').replace('-', '').replace('-', '').replace('-', '').replace('(', '').replace(')', '').replace('+', '').replace("·", "").replace("·", "").replace("·", "");
                if ((line_text.indexOf('@') != -1)) { //email
                    if (line_text.slice(0, 1) != '@' && line_text.indexOf('.') != -1) { //排除LINE ID前面的@
                        var check_email = line_text.toLowerCase();
                        check_email = check_email.replace("email", "").replace(":", "").replace("e-", "").replace("mail", "").replace("/tw", ".tw");
                        email = check_email;
                    }
                }
                //公司
                if (line_text.indexOf("司") != -1 && line_text.indexOf("有限") != -1) { //暫時把公司改成司，因為有時候會辨識司一個字
                    console.log('------------company');
                    console.log(line_text);
                    company = line_text;
                } else if (line_text.indexOf("院") != -1 || line_text.indexOf("銀行") != -1 || line_text.indexOf("银行") != -1 || line_text.indexOf("國際") != -1 || line_text.indexOf("国际") != -1 || line_text.indexOf("科技") != -1 || line_text.indexOf("矽谷") != -1 || line_text.indexOf("集團") != -1 || line_text.indexOf("集团") != -1 || line_text.indexOf("大學") != -1 || line_text.indexOf("大学") != -1 || line_text.indexOf("聯盟") != -1 || line_text.indexOf("联盟") != -1 || line_text.indexOf("人壽") != -1 || line_text.indexOf("人寿") != -1 || (line_text.toLowerCase()).indexOf("inc.") != -1 || (line_text.toLowerCase()).indexOf("co.") != -1 || (line_text.toLowerCase()).indexOf("technology") != -1) {
                    company2 = line_text;
                }
                //地址
                if (line_text.indexOf("路") != -1 || line_text.indexOf("市") != -1 || line_text.indexOf("室") != -1 || line_text.indexOf("樓") != -1 || line_text.indexOf("楼") != -1) {
                    address = line_text;
                }
                wordsize = bwidth * bheight;
                if (line_text.length >= 2 && line_text.length <= 7) {
                    //if(line_text.indexOf("業務") !=-1 || line_text.indexOf("經理") != -1 || line_text.indexOf("專員") != -1 || line_text.indexOf("協理") != -1 || line_text.indexOf("教授") != -1 || line_text.indexOf("院長") != -1 || line_text.indexOf("技術") != -1 || line_text.indexOf("行銷") != -1 || line_text.indexOf("主任") != -1 || line_text.indexOf("執行") != -1 || line_text.indexOf("顧問") != -1 || line_text.indexOf("大中華") != -1 || line_text.indexOf("研究") != -1 || line_text.indexOf("业务") != -1 || line_text.indexOf("业务") != -1 || line_text.indexOf("銷售") != -1 || line_text.indexOf("销售") != -1 || line_text.indexOf("統編") != -1 || line_text.indexOf("亞洲") != -1 || line_text.indexOf("工程") != -1 || line_text.indexOf("規劃") != -1 || line_text.indexOf("課長") != -1 || line_text.indexOf("創辦") != -1 || line_text.indexOf("辦公") != -1 || line_text.indexOf("市場") != -1 || line_text.indexOf("台灣") != -1 || line_text.indexOf("事業") != -1 || (line_text.toLowerCase()).indexOf("ceo") != -1 || line_text.indexOf("副理") != -1 || line_text.indexOf("處長") != -1 || line_text.indexOf("副總") != -1 || line_text.indexOf("博士") != -1 || line_text.indexOf("桌") != -1){
                    if (line_text.slice(0, 2) == "業務" || line_text.slice(0, 3) == "總經理" || line_text.slice(0, 2) == "經理" || line_text.indexOf("專員") != -1 || line_text.indexOf("協理") != -1 || line_text.indexOf("教授") != -1 || line_text.indexOf("院長") != -1 || line_text.slice(0, 2) == "技術" || line_text.slice(1, 3) == "術長" || line_text.indexOf("行銷") != -1 || line_text.indexOf("主任") != -1 || line_text.indexOf("執行") != -1 || line_text.indexOf("顧問") != -1 || line_text.indexOf("大中華") != -1 || line_text.indexOf("研究") != -1 || line_text.indexOf("业务") != -1 || line_text.indexOf("业务") != -1 || line_text.indexOf("銷售") != -1 || line_text.indexOf("销售") != -1 || line_text.indexOf("統編") != -1 || line_text.indexOf("亞洲") != -1 || line_text.indexOf("工程") != -1 || line_text.indexOf("規劃") != -1 || line_text.indexOf("課長") != -1 || line_text.indexOf("創辦") != -1 || line_text.indexOf("辦公") != -1 || line_text.indexOf("市場") != -1 || line_text.indexOf("台灣") != -1 || line_text.indexOf("事業") != -1 || (line_text.toLowerCase()).indexOf("ceo") != -1 || line_text.indexOf("副理") != -1 || line_text.indexOf("處長") != -1 || line_text.indexOf("副總") != -1 || line_text.indexOf("博士") != -1 || line_text.indexOf("有限") != -1 || line_text.indexOf("物聯") != -1 || line_text.indexOf("公司") != -1 || line_text.indexOf("科技") != -1 || line_text.indexOf("集團") != -1 || line_text.indexOf("電子") != -1 || line_text.indexOf("客服") != -1 || line_text.indexOf("編號") != -1 || line_text.indexOf("電話") != -1 || line_text.indexOf("電絡") != -1 || line_text.indexOf("機") != -1 || line_text.indexOf("桌") != -1) {
                        //continue;
                    } else {
                        //keyname.push({"size":wordsize, "name":line_text});
                        asize.push(wordsize);
                        keyname.push(line_text);
                    }
                }
                if (((line_text.toLowerCase()).indexOf("mobile") != -1 || line_text.indexOf("手機") != -1 || line_text.indexOf("手机") != -1 || line_text.indexOf("行動電話") != -1 || line_text.indexOf("行动电话") != -1 || line_text.indexOf("行動") != -1 || line_text.indexOf("行动") != -1) && line_text.indexOf("8869") != -1 || line_text.indexOf("09") != -1) {
                    var check_mobilephone = line_text;
                    check_mobilephone = (check_mobilephone.toLowerCase()).replace("mobile", "");
                    check_mobilephone = check_mobilephone.replace("手機", "").replace("手机", "").replace("行動電話", "").replace("行动电话", "").replace("行動", "").replace("行动", "");
                    check_mobilephone = check_mobilephone.replace(":", "");
                    mobilephone = check_mobilephone;
                    for_check_number = "";
                } else if (line_text.length >= 10 && line_text.indexOf('09') != -1) { //判斷長度大於10且包含09的string
                    var check_mobile = line_text.split("09")[1]; //把09之後的string切出來
                    if (!isNaN(Number(check_mobile.slice(0, 1)))) { //判斷切出來的string後面一位是否是數字
                        if (check_mobile.length >= 7 && check_mobile.length <= 8) { //判斷長度是否介於7到8之間
                            check_mobile = '09' + check_mobile; //補上前面09
                            mobilephone = check_mobile;
                        }
                    }
                    for_check_number = "";
                } else if ((line_text.toLowerCase()).indexOf("telphone") != -1 || (line_text.toLowerCase()).indexOf("tel") != -1 || line_text.indexOf("市話") != -1 || line_text.indexOf("专线") != -1 || (line_text.indexOf("電話") != -1 && line_text.indexOf("行動") == -1) || (line_text.indexOf("电话") != -1 && line_text.indexOf("行动") == -1)) {
                    console.log('tel')
                    var check_tel = line_text.toLowerCase();
                    var splitfax = "";
                    if (check_tel.indexOf("fax") != -1) { //當tel和fax同一行
                        splitfax = check_tel.split("fax")[1];
                        check_tel = check_tel.split("fax")[0];
                        fax = splitfax;
                        fax = fax.replace(":", "");
                    }
                    check_tel = check_tel.replace("telphone", "");
                    check_tel = check_tel.replace("tel", "");
                    check_tel = check_tel.replace("電話", "");
                    check_tel = check_tel.replace("电话", "");
                    check_tel = check_tel.replace("市話", "");
                    check_tel = check_tel.replace(":", "");
                    check_tel = check_tel.replace("+", "").replace("(", "").replace(")", "");
                    check_tel = check_tel.replace("/", "");
                    var second_check_tel = check_tel.slice(0, 1);
                    if (!isNaN(Number(second_check_tel)) || second_check_tel == "(" || second_check_tel == "+") {
                        tel = check_tel;
                    }
                } else if (line_text.indexOf('886') != -1) {
                    var check_phone_number = line_text.split("886")[1]; //把886之後的string切出來
                    console.log('381' + check_phone_number);
                    if (check_phone_number.slice(0, 1) == "9" || check_phone_number.slice(1, 2) == "9") { //判斷切出來的string後面一位是否是數字
                        if (check_phone_number.length <= 9) {
                            check_phone_number = "886" + check_phone_number;
                            mobilephone = check_phone_number;
                        }
                    } else {
                        if (!isNaN(Number(check_phone_number.slice(0, 1))) || check_phone_number.slice(0, 1) == "·") {
                            check_phone_number = check_phone_number.toLowerCase();
                            if (check_phone_number.indexOf('fax')) {
                                var split_fax = check_phone_number.split("fax")[1];
                                var tel_number = check_phone_number.split("fax")[0];
                                split_fax = split_fax.replace(":", "");
                                fax = split_fax;
                                tel_number = tel_number.replace(":", "");
                                tel = '886' + tel_number;
                            } else {
                                check_phone_number = "886" + check_phone_number;
                                tel = check_phone_number;
                            }
                        }
                    }
                } else if ((line_text.toLowerCase()).indexOf("fax") != -1 || line_text.indexOf("傳真") != -1 || line_text.indexOf("传真") != -1) {
                    console.log('fax');
                    var check_fax = line_text;
                    check_fax = (check_fax.toLowerCase()).replace("fax", "");
                    check_fax = check_fax.replace("传真", "");
                    check_fax = check_fax.replace("傳真", "");
                    check_fax = check_fax.replace(":", "");
                    fax = check_fax;
                } else if (line_text.match(patterntel)) {
                    console.log('match');
                    console.log('%%%%%' + line_text);
                    tel = line_text;
                }
                all_text = all_text + line_text + '\n';
                line_text = '';
            }
        } //end for loop
        console.log(JSON.stringify(keyname));
        if (keyname.length == 1) {
            cardname = keyname[0];
        } else {
            var max = -Infinity, min = +Infinity;
            for (var i = 0; i < asize.length; i++) {
                if (asize[i] > max) {
                    max = asize[i];
                    console.log(asize[i]);
                    cardname = keyname[i];
                }
                if (asize[i] < min) {
                    min = asize[i];
                    console.log(asize[i]);
                    console.log(keyname[i]);
                }
            }
        }
        console.log(all_text);
        if (all_text == "") {
            res_data = {
                "variables": {
                    "Business_Card": 400, //名片辨識結果的數字，成功200 失敗400
                    "Business_Card_Name": "", //名片所有人姓名
                    "Business_Card_Company": "", //名片所有人公司名稱
                    "Business_Card_Address": "", //名片所有人公司地址
                    "Business_Card_Email": "", //Email
                    "Business_Card_Celephone": "", //名片所有人手機號碼
                    "Business_Card_Phone": "" //名片所有人分機
                }
            };
        } else {
            if (company == "" && company2 != "") {
                company = company2;
            }
            res_data = {
                "variables": {
                    "Business_Card": 200, //名片辨識結果的數字，成功200 失敗400
                    "Business_Card_Name": cardname, //名片所有人姓名
                    "Business_Card_Company": company, //名片所有人公司名稱
                    "Business_Card_Address": address, //名片所有人公司地址
                    "Business_Card_Email": email, //Email
                    "Business_Card_Celephone": mobilephone, //名片所有人手機號碼
                    "Business_Card_Phone": tel //名片所有人分機
                }
            };
        }
        this.res.send(res_data);
    }.bind({ req: request, res: response }));
    //response.send(res_data);
});

app.post('/api/save_Graph', function (request, response) {
    console.log(request.body);
    /*{
    "variables": {
        "Business_Card": 200,
        "Business_Card_Name": "林智慧",
        "Business_Card_Company": "tsti大同世界科技股份有限公司",
        "Business_Card_Address": "台北市中山104中山北路三段22號",
        "Business_Card_Mobile": "093202637",
        "Business_Card_Phone": "0225985643"
    }
} */
    var ms_token = request.body.variables.ms_token;
    var Business_Card_Name = request.body.variables.Business_Card_Name;
    console.log('Business_Card_Name: '+Business_Card_Name);
    var Business_Card_Company = request.body.variables.Business_Card_Company;
    console.log('Business_Card_Company: '+Business_Card_Company);
    var Business_Card_Address = request.body.variables.Business_Card_Address;
    console.log('Business_Card_Address: '+Business_Card_Address);
    var Business_Card_Mobile = request.body.variables.Business_Card_Mobile;
    console.log('Business_Card_Mobile: '+Business_Card_Mobile);
    var Business_Card_Phone = request.body.variables.Business_Card_Phone;
    console.log('Business_Card_Phone: '+Business_Card_Phone);
    var Business_Card_Email = request.body.variables.Business_Card_Email;
    console.log('Business_Card_Email: '+Business_Card_Email);
    var givenName = Business_Card_Name.slice(0,1);
    var surname = Business_Card_Name.slice(1,3);
    console.log(givenName);
    console.log(surname);
    var data = {
        "givenName": givenName,
        "surname": surname,
        "companyName": Business_Card_Company,
        "emailAddresses": [
            {
                "address": Business_Card_Email,
                "name": Business_Card_Name
            }
        ],
        "businessPhones": [
            Business_Card_Phone
        ],
        "mobilePhone": Business_Card_Mobile,
        "officeLocation": Business_Card_Address
    }
    //console.log(data);
    var req = require("request");
    var options = {
        url: 'http://tsti-graph.azurewebsites.net/graph/addcontacts',
        method: 'POST',
        headers: {
            'Authorization': ms_token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    };
    //console.log('325-----'+JSON.stringify(options));
    req(options, function (error, response, body) {
        //response.send({"variables":{"Add_Friends": 400}});
        if (error) console.log(error);
        console.log('bbbbb');
        console.log(body);
        var body_parse_json = JSON.parse(body);
        if(body_parse_json.statusCode == 201){
            var res_data = {
                "variables":{
                    "Add_Friends": 200
                }
            };
        } else {
            var res_data = {
                "variables":{
                    "Add_Friends": body_parse_json.statusCode
                }
            };
        }
        this.res.send(res_data);
    }.bind({ req: request, res: response}));
});

function FollowEvent(acct) {
    logger.info('----------[Follow]---------');
    logger.info(acct);
}

var http = require('http');
var server = http.Server(app);	// create express server
var options = {
    pingTimeout: 60000,
    pingInterval: 3000
};
var listener = server.listen(process.env.port || process.env.PORT || 3978, function () {
    logger.info('Server listening to ' + listener.address().port);
});

process.on('uncaughtException', function (err) {
    logger.error('uncaughtException occurred: ' + (err.stack ? err.stack : err)); //loggererror
});