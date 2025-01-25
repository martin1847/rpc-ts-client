
import * as $ from 'jquery';

//import {RpcResult,RpcService} from './rpc/index';
import {RpcResult,RpcService,Meta} from 'krpc-base';
import {RpcClient} from 'bt-rpc-web';


import {setDefaultTransportFactory} from 'bt-rpc-web/dist/http/transport';
import {XhrTransport} from 'bt-rpc-web/dist/http/xhr';


import {
  IsInt,
  Length,
  IsEmail,
  IsFQDN,
  IsDate,
  Min,
  Max,IsDefined
} from 'class-validator';
import {DemoService} from './example/demo-service';
import {APP,TimeReq,TimeResult} from './example/demo-java-server-dto';

// setDefaultTransportFactory(XhrTransport())

class VerService{

	readonly pre = "M/";

	constructor(readonly rpcService: RpcService) {}
	
	h(header?: Meta): Promise<RpcResult<string>>{
		return this.rpcService.async(this.pre+"h",header);
	}
}

export interface  Passcode {
  expiresAt: number;
  passcode: string;
}

export class  Alicheck {

  @IsDefined()
  @Length(3, 50)
  username: string;


  /// 客户端getNVCVal()函数的值,最大14K
  @Length(1, 14336)
  @IsDefined()
  nvcVal: string;

  constructor(username: string,nvcVal: string) {
    this.username = username;
    this.nvcVal = nvcVal;
  }
}


class AlicheckService{

	readonly pre = "Alicheck/";

	constructor(readonly rpcService: RpcService) {}
/// 获取appkey:应用类型标识。和scene一起决定了无痕验证的业务场景与后端对应使用的策略模型
  appkey(header?: Meta): Promise<RpcResult<string>>{
    return this.rpcService.async(this.pre+"appkey",null,header);
  }

  mockForTest(req:Alicheck, header?: Meta): Promise<RpcResult<Passcode>>{
    return this.rpcService.async(this.pre+"mockForTest",req,header);
  }
}


class EchoApp {
  static readonly INTERVAL = 500;  // ms
  static readonly MAX_STREAM_MESSAGES = 50;


  constructor(public demoService: AlicheckService) {}

  static addMessage(message: string, cssClass: string) {
    $('#first').after($('<div/>').addClass('row').append($('<div>')
    .append($('<span/>').addClass('label ' + cssClass).text(message))));
  }

  static addLeftMessage(message: string) {
    this.addMessage(message, 'label-primary pull-left');
  }

  static addRightMessage(message: string) {
    this.addMessage(message, 'label-default pull-right');
  }

  echo(msg: string) {
    EchoApp.addLeftMessage(msg);
    const request = new TimeReq(msg,18);

    this.demoService.mockForTest(new Alicheck("123","nvl"))
    .then(response=>
      EchoApp.addRightMessage(response.data!.passcode));
   
    // this.demoService.h().then(response=>
    //   EchoApp.addRightMessage(response.data!));
   
    
  }



  send(e: {}) {
    const _msg: string = $('#msg').val() as string;
    const msg = _msg.trim();
    $('#msg').val('');  // clear the text box
    if (!msg) return false;

    this.echo(msg);
  }

  load() {
    const self = this;
    jQuery(() => {
      // event handlers
      $('#send').click(self.send.bind(self));
      $('#msg').keyup((e) => {
        if (e.keyCode === 13) self.send(e);  // enter key
        return false;
      });

      // const oauthSerice = RpcClient.create({
      //   host:'https://backoffice-api.botaoyx.com', 
      //   app:"admin-auth",
      //   service:"Oauth",
      //   withCredentials:false
      //   //headers:{"c-id": "xxxxx"} // use https://github.com/fingerprintjs/fingerprintjs
      // });
    
      // oauthSerice.async<string>("user",null).then(res=>{
      //     console.log("oauthSerice User  : "+ res.data)
      // });
    

      $('#msg').focus();
    });
  }
}

RpcClient.debug = 0;
const serviceBase =RpcClient.create({
    host:'https://idemo.krpc.tech', 
    app:"auth",
    withCredentials:true,
    clientId:"c-unused-web-test2",
    timeoutMill:150
    //headers:{"c-id": "xxxxx"} // use https://github.com/fingerprintjs/fingerprintjs
  });


const echoApp = new EchoApp(new AlicheckService(serviceBase));
echoApp.load();