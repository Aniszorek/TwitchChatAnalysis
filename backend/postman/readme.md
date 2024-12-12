TwitchChatAnalytics Postman
- pobierz konfiguracje z repo
- odpal postmana, connections, import


Co ustawiać i jak:


- endpointy /twitch
  - aby się autoryzować trzeba mieć wpisany swój `twitch_oauth_token` w pliku `.env` - będzie to zmienione gdy będziemy przechowywać ten token i client_id na frontendzie
  - Header `authorization: bearer token` musi być ustawiony - podaj w nim idToken z frontendu (cognitoIdToken)
  - jakie body/queryParamsy? - sprawdzić w kodzie w odpowiednim kontrolerze np.
  ```typescript
      @TCASecured({
        requiredQueryParams: ['broadcaster_id', 'moderator_id'], // wymagane query paramy
        bodyValidationFn: isPatchChatSettingsPayload, // funkcja do walidowania request body - można w niej sprawdzić wymaganą strukturę body
        requiredRole: COGNITO_ROLES.MODERATOR, // wymagana rola nadawana przez AWS, która wynika z Headera authorization
        actionDescription: "Patch Chat Settings", // opis akcji
        requiredHeaders: ['broadcasteruserlogin'] // wymagane dodatkowe headery
    })
  ```


- endpointy /aws - to be changed - będzie tak jak dla twitchowych endpointów
    - Header `authorization: bearer token` musi być ustawiony - podaj w nim idToken z frontendu (cognitoIdToken)
    - Header `broadcasteruserlogin` - wpisać ten co na FE (chyba że testujesz zabezpieczenia)
    - jakie body/queryParamsy do endpointów? - najlepiej sprawdzić w kodzie (folder api_gateway_calls) - nie robię dokumentacji bo planuję refactor tego bagna
    
  