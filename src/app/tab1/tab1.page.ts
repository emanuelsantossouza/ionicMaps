import { Component, ElementRef, NgZone, ViewChild } from '@angular/core';
import { GoogleMap, Marker, Polyline } from '@capacitor/google-maps';
import { environment } from 'src/environments/environment';
import { Geolocation, Position } from '@capacitor/geolocation';
import { LoadingController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { listaEnderecos } from '../model/requisicaoGoogleMaps';
import { CameraConfig, LatLng } from '@capacitor/google-maps/dist/typings/definitions';



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
  markerDestinion: any;

  dadosGeocodeApi: any;
  googleDeriction = new google.maps.DirectionsService()
  usuarioCordenadas = Geolocation.getCurrentPosition();
  polyLineId: string = '';
  markerId: string = '';

  constructor(
    private loadCrtl: LoadingController,
    private ngZone: NgZone,
    private http: HttpClient) {
    console.log(this.googleAutoComplet)
  }

  async ionViewDidEnter() {
    await this.CreateMap()
  }

  async CreateMap() {
    this.loading = await this.loadCrtl.create({ message: 'Por favor, aguarde...' });
    await this.loading.present();

    try {
      this.map = await GoogleMap.create({
        apiKey: environment.mapsKey,
        element: this.mapRef?.nativeElement,
        id: "Map-Cordova",
        config: {
          center: {
            lat: (await this.usuarioCordenadas).coords.latitude,
            lng: (await this.usuarioCordenadas).coords.longitude,
          },
          zoom: 13,
          disableDefaultUI: true,
          disableDoubleClickZoom: true,
          backgroundColor: "white"
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

    try {
      this.origemMarker = this.map?.addMarker({
        title: 'Origem',
        coordinate: {
          lat: (await this.usuarioCordenadas).coords.latitude,
          lng: (await this.usuarioCordenadas).coords.longitude,
        }
      })
    } catch (erro) {
      console.log(`o erro aquii boy ${erro}`)
    }

    this.markerId = this.origemMarker.getId();
    console.log(this.markerId);
  }


  async calcuRota(item: any) {
    this.addOringMarker()
    this.destination = true
    console.log(item);

    this.http.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        key: environment.mapsKey,
        place_id: item.place_id,
      }
    }).subscribe(async (dadosLocais) => {
      this.dadosGeocodeApi = dadosLocais
      console.log(dadosLocais)
      console.log(this.dadosGeocodeApi.results[0])

      this.markerDestinion = this.map?.addMarker({
        coordinate: {
          lat: this.dadosGeocodeApi.results[0].geometry.location.lat,
          lng: this.dadosGeocodeApi.results[0].geometry.location.lng,
        },
        title: this.dadosGeocodeApi.results[0].formatted_address,
        // iconUrl: 'https://raw.githubusercontent.com/emanuelsantossouza/tccImg/main/icons/Design%20sem%20nome%20(6).png',
        iconSize: {
          height: 50,
          width: 50,
        },
        isFlat: true,
        draggable: true,
      })

      const destinationLatLng = new google.maps.LatLng(
        this.dadosGeocodeApi.results[0].geometry.location.lat,
        this.dadosGeocodeApi.results[0].geometry.location.lng
      );

      const oringLatLng = new google.maps.LatLng(
        (await this.usuarioCordenadas).coords.latitude,
        (await this.usuarioCordenadas).coords.longitude,
      )

      this.googleDeriction.route({
        origin: oringLatLng,
        destination: destinationLatLng,
        travelMode: 'DRIVING',
      }, async (results: any, status: any) => {
        if (status === 'OK') {
          const points: LatLng[] = [];

          const routes = results.routes[0].overview_path;

          for (let i = 0; i < routes.length; i++) {
            points.push({
              lat: routes[i].lat(),
              lng: routes[i].lng()
            });
          }

          const lines: Polyline[] = [
            {
              path: points,
              strokeColor: '#EDCF00',
              strokeWeight: 3,
              geodesic: true,
              visible: true,
              clickable: true,
            },
          ];

          await this.map?.addPolylines(lines);

          const cameraConfig: CameraConfig = {
            coordinate: {
              lat: points[0].lat,
              lng: points[0].lng
            },
            zoom: 15,
          }
          this.map?.setCamera(cameraConfig)
        }
      });
    }
    )
  }


  async back() {
    try {
      await this.map?.removeMarker(this.markerId);
      
      this.destination = true
    } catch (error) {

    }
  }
}
