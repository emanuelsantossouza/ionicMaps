import { Component, ElementRef, NgZone, ViewChild } from '@angular/core';
import { listaEnderecos } from '../model/requisicaoGoogleMaps';
import { Geolocation } from '@capacitor/geolocation';
import { LoadingController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

declare var google: any;

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page {

  @ViewChild('map') mapView?: ElementRef;

  map!: google.maps.Map;

  coordinates!: GeolocationPosition;
  private autocomplete = new google.maps.places.AutocompleteService();
  private redirectionService = new google.maps.DirectionsService();
  private directionsRenderer = new google.maps.DirectionsRenderer();

  listaEndereco: listaEnderecos[] = [];
  markeOrigem: any;
  dadosGeocodeApi: any;
  loading?: HTMLIonLoadingElement;

  constructor(
    private loadCrtl: LoadingController,
    private http: HttpClient
  ) { }

  async ionViewDidEnter() {
    this.initMap();
    await this.addMarker();
    await this.directionsRenderer.setMap(this.map);
  }

  initMap(): void {
    this.ShowLoading()
    try {
      this.map = new google.maps.Map(this.mapView!.nativeElement, {
        mapId: 'Mapa-TCC Chama aí',
        center: {
          lat: -22.3281152,
          lng: -48.5523456
        },
        zoom: 15,
        disableDefaultUI: true
      });
    } catch (erro) {
      console.log(erro);
    }
  }

  buscar(buscaCampo: any) {
    const busca = buscaCampo.target.value as string;

    if (!busca.trim().length) {
      this.listaEndereco = [];
    }

    this.autocomplete.getPlacePredictions({ input: busca }, (respotaServidor: any) => {
      this.listaEndereco = respotaServidor;
      console.log(respotaServidor);
    });
  }

  async addMarker() {
    const myLocation = await Geolocation.getCurrentPosition();

    this.markeOrigem = new google.maps.Marker({
      map: this.map,
      title: 'Origem',
      position: {
        lat: myLocation.coords.latitude,
        lng: myLocation.coords.longitude,
      },
      animation: google.maps.Animation.DROP,
      opacity: 0.9
    });
  }

  calcuRota(item: any) {
    console.log(item);

    this.http.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        key: environment.mapsKey,
        place_id: item.place_id,
      }
    }).subscribe((dadosApi) => {
      this.dadosGeocodeApi = dadosApi;

      const destinationLatLng = new google.maps.LatLng(
        this.dadosGeocodeApi.results[0].geometry.location.lat,
        this.dadosGeocodeApi.results[0].geometry.location.lng
      );

      const request = {
        origin: this.markeOrigem.getPosition(),
        destination: destinationLatLng,
        travelMode: google.maps.TravelMode.DRIVING
      };

      this.redirectionService.route(request, (result: any, status: any) => {
        if (status === 'OK') {
          this.directionsRenderer.setDirections(result);
        }
      });
    });
  }

  async ShowLoading(){
    this.loading = await this.loadCrtl.create({
      message: 'Precisamos utilizar a sua localização para conctar você com os nosso motoboys....',
      duration: 1500
    });
    await this.loading.present();
  }
}
