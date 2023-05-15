import { Component, ElementRef, NgZone, ViewChild } from '@angular/core';
import { GoogleMap, Marker } from '@capacitor/google-maps';
import { environment } from 'src/environments/environment';
import { Geolocation, Position } from '@capacitor/geolocation';
import { LoadingController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { listaEnderecos } from '../model/requisicaoGoogleMaps';


declare var google: any;

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page {

  @ViewChild('map', { static: false }) mapRef?: ElementRef;

  map?: GoogleMap;
  loading?: HTMLIonLoadingElement;
  serch: string = '';
  private googleAutoComplet = new google.maps.places.AutocompleteService();


  listaEnderecos: listaEnderecos[] = []
  origemMarker!: any;
  destination: any;

  dadosGeocodeApi: any;
  googleDeriction = new google.maps.DirectionsService()



  constructor(
    private loadCrtl: LoadingController,
    private ngZone: NgZone,
    private http: HttpClient) {
    console.log(this.googleAutoComplet)
  }

  async ionViewDidEnter() {
    await this.CreateMap()
    await this.addOringMarker()
  }

  async CreateMap() {
    this.loading = await this.loadCrtl.create({ message: 'Por favor, aguarde...' });
    await this.loading.present();
    // const usuarioCordenadas = await Geolocation.getCurrentPosition();

    try {
      this.map = await GoogleMap.create({
        apiKey: environment.mapsKey,
        element: this.mapRef?.nativeElement,
        id: "Map-Cordova",
        config: {
          center: {
            lat: -22.3281152,
            lng: -48.5523456,
          },
          zoom: 15,
          disableDefaultUI: true,
          disableDoubleClickZoom: true,
          backgroundColor: "red"
        }
      });



    } catch (erro) {
      console.log(erro);
    } finally {
      this.loading.dismiss();
    }
  }

  async buscarEndereco(campoBusca: any) {
    const busca = campoBusca.target.value as string;

    if (!busca.trim().length) {
      this.listaEnderecos = []
    }

    this.googleAutoComplet.getPlacePredictions({ input: busca }, (listaLocais: any) => {
      this.listaEnderecos = listaLocais;
    })
  }

  async addOringMarker() {
    const mylocation = Geolocation.getCurrentPosition()

    try {
      this.origemMarker = this.map?.addMarker({
        title: 'Origem',
        coordinate: {
          lat: (await mylocation).coords.latitude,
          lng: (await mylocation).coords.longitude,
        }
      })
    } catch (erro) {
      console.log(`o erro aquii boy ${erro}`)
    }
  }


  async calcuRota(item: any) {
    this.serch = '';
    console.log(item);

    this.http.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        key: environment.mapsKey,
        place_id: item.place_id,
      }

    }).subscribe((dadosLocais) => {
      this.dadosGeocodeApi = dadosLocais
      console.log(dadosLocais)
      console.log(this.dadosGeocodeApi.results[0])

      const markerDestinion = this.map?.addMarker({
        coordinate: {
          lat: this.dadosGeocodeApi.results[0].geometry.location.lat,
          lng: this.dadosGeocodeApi.results[0].geometry.location.lng,
        },
        title: this.dadosGeocodeApi.results[0].formatted_address
      })

      this.map?.addPolylines([{
        editable: true,
        draggable: true,
        icons: [this.dadosGeocodeApi.results[0].geometry.location.lat,this.dadosGeocodeApi.results[0].geometry.location.lng],
        strokeColor: '#000',
        strokeWeight: 5
      }])

      console.log(this.map?.addPolylines([{
        editable: true,
        draggable: true,
        icons: [this.origemMarker, markerDestinion],
        strokeColor: '#000',
        strokeWeight: 5
       }]))
    }
  )}
}

