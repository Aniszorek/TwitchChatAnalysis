TwitchChatAnalytics Postman
- pobierz konfiguracje z repo
- odpal postmana, connections, import

Co ustawiać i jak:
- endpointy /aws:
    - Authorization: Bearer token - idToken z frontendu
    - ręcznie dodać header BroadcasterUserLogin - wpisać ten co na FE (chyba że testujesz zabezpieczenia)
    - jakie body/queryParamsy do endpointów? - najlepiej sprawdzić w kodzie (folder api_gateway_calls) - nie robię dokumentacji bo planuję refactor tego bagna

- endpointy /twitch
    - aby się autoryzować trzeba mieć wpisany swój twitch_oauth_token w pliku .env - będzie to zmienione gdy będziemy przechowywać ten token i client_id na frontendzie
    - jakie body/queryParamsy? - sprawdzić w odpowiednim routerze na backendzie (/routes/twitch)