import { Component } from '@angular/core';
import { google } from 'googleapis';
import * as fs from 'fs';



@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss']
})
export class Tab3Page {

  constructor() { }

  loginGmail() {
    const credentials = {
      client_id: '778831920146-76f5c98iuek74gbfvpgl1gi4dnuhcon9.apps.googleusercontent.com',
      client_secret: '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',
      redirect_uris: ['http://localhost:8200', 'http://localhost', 'http://localhost:8100']
    };
    
    const client = new google.auth.OAuth2(
      credentials.client_id,
      credentials.client_secret,
      credentials.redirect_uris[0]
    );
    
    const authUrl = client.generateAuthUrl({
      access_type: 'offline',
      scope: 'https://www.googleapis.com/auth/drive'
    });
    console.log('Autorize este aplicativo visitando este URL:', authUrl);
    // Após o usuário autorizar o aplicativo e ser redirecionado para a URL de redirecionamento definida,
    // o código de autorização será incluído na URL de redirecionamento como um parâmetro.
    // Você precisa extrair esse código e trocá-lo pelo token de acesso.
  
    // Por exemplo, se a URL de redirecionamento for http://localhost:8200?code=CODE_HERE,
    // você pode extrair o código da seguinte maneira:
    const code = new URLSearchParams(window.location.search).get('code');
  
    if (code) {
      client.getToken(code, (err, tokens) => {
        if (err) {
          console.error('Erro ao obter o token de acesso:', err);
          return;
        }
        // O token de acesso está disponível em tokens.access_token
        console.log('Token de acesso:', tokens?.access_token);
        // Você pode usar o token de acesso para autenticar suas solicitações à API do Google
        // e acessar os recursos protegidos.
      });
    }
  }


}
