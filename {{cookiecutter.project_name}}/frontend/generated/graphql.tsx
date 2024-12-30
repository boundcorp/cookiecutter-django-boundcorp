import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  DateTime: any;
  Decimal: any;
  GenericScalar: any;
  JSONString: any;
  UUID: any;
};

export type City = {
  __typename?: 'City';
  centerPoint: Scalars['String'];
  enabled: Scalars['Boolean'];
  id: Scalars['String'];
  name: Scalars['String'];
  state: CityState;
  stub?: Maybe<Scalars['String']>;
};

export enum CityState {
  Ca = 'CA'
}

export type ContactPropertyInput = {
  propertyId: Scalars['String'];
};

export type ContactPropertyResult = ContactPropertySuccess | Error;

export type ContactPropertySuccess = {
  __typename?: 'ContactPropertySuccess';
  property?: Maybe<PropertyListing>;
  user?: Maybe<UserAccount>;
};



export type Error = {
  __typename?: 'Error';
  message: Scalars['String'];
};

export type FieldError = {
  __typename?: 'FieldError';
  field: Scalars['String'];
  message: Scalars['String'];
};

export type FindAccountResult = Error | NoAccountFound | UserAccount;



export type Mutation = {
  __typename?: 'Mutation';
  contactProperty?: Maybe<ContactPropertyResult>;
  refreshToken?: Maybe<Refresh>;
  registerUser?: Maybe<RegisterUserResult>;
  sendLoginCode?: Maybe<SendLoginCodeResult>;
  subscribe?: Maybe<SubscribeResult>;
  tokenAuth?: Maybe<ObtainJsonWebToken>;
  unsubscribe?: Maybe<UnsubscribeResult>;
  updateProfile?: Maybe<UpdateProfileResult>;
  verifyToken?: Maybe<Verify>;
};


export type MutationContactPropertyArgs = {
  input?: Maybe<ContactPropertyInput>;
};


export type MutationRefreshTokenArgs = {
  refreshToken: Scalars['String'];
};


export type MutationRegisterUserArgs = {
  input?: Maybe<RegisterUserInput>;
};


export type MutationSendLoginCodeArgs = {
  input?: Maybe<SendLoginCodeInput>;
};


export type MutationSubscribeArgs = {
  input?: Maybe<SubscribeInput>;
};


export type MutationTokenAuthArgs = {
  password: Scalars['String'];
  username: Scalars['String'];
};


export type MutationUnsubscribeArgs = {
  input?: Maybe<UnsubscribeInput>;
};


export type MutationUpdateProfileArgs = {
  input?: Maybe<UpdateProfileInput>;
};


export type MutationVerifyTokenArgs = {
  token: Scalars['String'];
};

export type NoAccountFound = {
  __typename?: 'NoAccountFound';
  success: Scalars['Boolean'];
};

export type ObtainJsonWebToken = {
  __typename?: 'ObtainJSONWebToken';
  refreshToken?: Maybe<Scalars['String']>;
  token?: Maybe<Scalars['String']>;
};

export type PropertyFilterSetInput = {
  boundary?: Maybe<Scalars['String']>;
  cityId?: Maybe<Scalars['String']>;
  city_Stub?: Maybe<Scalars['String']>;
};

export type PropertyListing = {
  __typename?: 'PropertyListing';
  agentCompany?: Maybe<Scalars['String']>;
  agentEmail: Scalars['String'];
  agentLicense?: Maybe<Scalars['String']>;
  agentName: Scalars['String'];
  agentPhone: Scalars['String'];
  agentPhoto?: Maybe<Scalars['String']>;
  alreadyContacted: Scalars['Boolean'];
  bathrooms: Scalars['Decimal'];
  becomesPublicAt: Scalars['DateTime'];
  bedrooms: Scalars['Int'];
  city: City;
  createdAt: Scalars['DateTime'];
  currentImage: Scalars['String'];
  daysRemaining: Scalars['Int'];
  description: Scalars['String'];
  id: Scalars['ID'];
  location: Scalars['String'];
  numberOfContacts: Scalars['Int'];
  price: Scalars['Int'];
  propertyType: PropertyListingPropertyType;
  squareFeet: Scalars['Int'];
  state: PropertyListingState;
  stub?: Maybe<Scalars['String']>;
  title: Scalars['String'];
  zip: Scalars['String'];
};

export enum PropertyListingPropertyType {
  Apartment = 'APARTMENT',
  Condominium = 'CONDOMINIUM',
  House = 'HOUSE',
  Land = 'LAND',
  Other = 'OTHER',
  ResidentialLot = 'RESIDENTIAL_LOT',
  SingleFamily = 'SINGLE_FAMILY',
  Townhouse = 'TOWNHOUSE'
}

export enum PropertyListingState {
  Ca = 'CA'
}

export type Query = {
  __typename?: 'Query';
  findAccount?: Maybe<FindAccountResult>;
  getCities?: Maybe<Array<City>>;
  getCity?: Maybe<City>;
  getProperties?: Maybe<Array<PropertyListing>>;
  getProperty?: Maybe<PropertyListing>;
  myProfile?: Maybe<UserProfile>;
};


export type QueryFindAccountArgs = {
  email?: Maybe<Scalars['String']>;
  phone?: Maybe<Scalars['String']>;
};


export type QueryGetCityArgs = {
  stub: Scalars['String'];
};


export type QueryGetPropertiesArgs = {
  filters?: Maybe<PropertyFilterSetInput>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
};


export type QueryGetPropertyArgs = {
  stub: Scalars['String'];
};

export type Refresh = {
  __typename?: 'Refresh';
  payload?: Maybe<Scalars['GenericScalar']>;
  refreshToken?: Maybe<Scalars['String']>;
  token?: Maybe<Scalars['String']>;
};

export type RegisterUserInput = {
  email?: Maybe<Scalars['String']>;
  firstName: Scalars['String'];
  lastName: Scalars['String'];
  phone?: Maybe<Scalars['String']>;
};

export type RegisterUserResult = Error | FieldError | UserAccount;

export type SendLoginCodeInput = {
  username: Scalars['String'];
};

export type SendLoginCodeResult = Error | SendLoginCodeSuccess;

export type SendLoginCodeSuccess = {
  __typename?: 'SendLoginCodeSuccess';
  deliveryMethod: Scalars['String'];
  user: UserAccount;
  validForMinutes: Scalars['Int'];
};

export type SubscribeInput = {
  cityId?: Maybe<Scalars['String']>;
  geoBoundary?: Maybe<Scalars['JSONString']>;
  geoName?: Maybe<Scalars['String']>;
};

export type SubscribeResult = Error | SubscribeSuccess;

export type SubscribeSuccess = {
  __typename?: 'SubscribeSuccess';
  subscription: Subscription;
  user: UserAccount;
};

export type Subscription = {
  __typename?: 'Subscription';
  boundary?: Maybe<Scalars['String']>;
  city?: Maybe<City>;
  geoName?: Maybe<Scalars['String']>;
  id: Scalars['UUID'];
  title: Scalars['String'];
  type: SubscriptionType;
};

export enum SubscriptionType {
  City = 'CITY',
  GeoBoundary = 'GEO_BOUNDARY'
}


export type UnsubscribeInput = {
  email?: Maybe<Scalars['String']>;
  phone?: Maybe<Scalars['String']>;
  subscriptionId?: Maybe<Scalars['String']>;
};

export type UnsubscribeResult = Error | UnsubscribeSuccess;

export type UnsubscribeSuccess = {
  __typename?: 'UnsubscribeSuccess';
  success?: Maybe<Scalars['Boolean']>;
};

export type UpdateProfileInput = {
  firstName?: Maybe<Scalars['String']>;
  lastName?: Maybe<Scalars['String']>;
  notifications?: Maybe<Scalars['String']>;
};

export type UpdateProfileResult = Error | UserProfile;

export type UserAccount = {
  __typename?: 'UserAccount';
  id: Scalars['UUID'];
  username: Scalars['String'];
};

export type UserProfile = {
  __typename?: 'UserProfile';
  email: Scalars['String'];
  firstName: Scalars['String'];
  id: Scalars['UUID'];
  lastName: Scalars['String'];
  phone?: Maybe<Scalars['String']>;
  subscriptions: Array<Subscription>;
  username: Scalars['String'];
};

export type Verify = {
  __typename?: 'Verify';
  payload?: Maybe<Scalars['GenericScalar']>;
};

export type PropertyListingFragment = (
  { __typename?: 'PropertyListing', id: string, createdAt: any, title: string, bathrooms: any, bedrooms: number, squareFeet: number, propertyType: PropertyListingPropertyType, price: number, description: string, becomesPublicAt: any, daysRemaining: number, location: string, currentImage: string, stub?: Maybe<string>, alreadyContacted: boolean, numberOfContacts: number, city: { __typename?: 'City', id: string, name: string, state: CityState, stub?: Maybe<string> } }
  & AgentFieldsFragment
);

export type CityFragment = { __typename?: 'City', id: string, name: string, state: CityState, stub?: Maybe<string>, centerPoint: string };

export type AgentFieldsFragment = { __typename?: 'PropertyListing', agentName: string, agentEmail: string, agentPhone: string, agentPhoto?: Maybe<string>, agentLicense?: Maybe<string>, agentCompany?: Maybe<string> };

export type GetPropertiesQueryVariables = Exact<{
  filters?: Maybe<PropertyFilterSetInput>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
}>;


export type GetPropertiesQuery = { __typename?: 'Query', getProperties?: Maybe<Array<(
    { __typename?: 'PropertyListing' }
    & PropertyListingFragment
  )>> };

export type GetPropertyQueryVariables = Exact<{
  stub: Scalars['String'];
}>;


export type GetPropertyQuery = { __typename?: 'Query', getProperty?: Maybe<(
    { __typename?: 'PropertyListing' }
    & PropertyListingFragment
  )> };

export type GetCitiesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetCitiesQuery = { __typename?: 'Query', getCities?: Maybe<Array<(
    { __typename?: 'City' }
    & CityFragment
  )>> };

export type GetCityQueryVariables = Exact<{
  stub: Scalars['String'];
}>;


export type GetCityQuery = { __typename?: 'Query', getCity?: Maybe<(
    { __typename?: 'City' }
    & CityFragment
  )> };

export type UserProfileFragment = { __typename?: 'UserProfile', id: any, firstName: string, lastName: string, email: string, phone?: Maybe<string>, username: string, subscriptions: Array<(
    { __typename?: 'Subscription' }
    & SubscriptionFragment
  )> };

export type UserAccountFragment = { __typename?: 'UserAccount', username: string };

export type SubscriptionFragment = { __typename?: 'Subscription', id: any, type: SubscriptionType, title: string, geoName?: Maybe<string>, city?: Maybe<(
    { __typename?: 'City' }
    & CityFragment
  )> };

export type TokenAuthMutationVariables = Exact<{
  username: Scalars['String'];
  password: Scalars['String'];
}>;


export type TokenAuthMutation = { __typename?: 'Mutation', tokenAuth?: Maybe<{ __typename?: 'ObtainJSONWebToken', token?: Maybe<string>, refreshToken?: Maybe<string> }> };

export type RefreshTokenMutationVariables = Exact<{
  refreshToken: Scalars['String'];
}>;


export type RefreshTokenMutation = { __typename?: 'Mutation', refreshToken?: Maybe<{ __typename?: 'Refresh', token?: Maybe<string>, refreshToken?: Maybe<string>, payload?: Maybe<any> }> };

export type RegisterUserMutationVariables = Exact<{
  input: RegisterUserInput;
}>;


export type RegisterUserMutation = { __typename?: 'Mutation', registerUser?: Maybe<{ __typename: 'Error', message: string } | { __typename: 'FieldError', message: string, field: string } | { __typename: 'UserAccount', username: string }> };

export type SendLoginCodeMutationVariables = Exact<{
  input: SendLoginCodeInput;
}>;


export type SendLoginCodeMutation = { __typename?: 'Mutation', sendLoginCode?: Maybe<{ __typename: 'Error', message: string } | { __typename: 'SendLoginCodeSuccess', validForMinutes: number, deliveryMethod: string, user: { __typename?: 'UserAccount', username: string } }> };

export type UpdateProfileMutationVariables = Exact<{
  input: UpdateProfileInput;
}>;


export type UpdateProfileMutation = { __typename?: 'Mutation', updateProfile?: Maybe<{ __typename: 'Error', message: string } | (
    { __typename: 'UserProfile' }
    & UserProfileFragment
  )> };

export type ContactPropertyMutationVariables = Exact<{
  input: ContactPropertyInput;
}>;


export type ContactPropertyMutation = { __typename?: 'Mutation', contactProperty?: Maybe<{ __typename: 'ContactPropertySuccess', property?: Maybe<(
      { __typename?: 'PropertyListing' }
      & PropertyListingFragment
    )> } | { __typename: 'Error', message: string }> };

export type SubscribeMutationVariables = Exact<{
  input: SubscribeInput;
}>;


export type SubscribeMutation = { __typename?: 'Mutation', subscribe?: Maybe<{ __typename: 'Error', message: string } | { __typename: 'SubscribeSuccess', subscription: (
      { __typename?: 'Subscription' }
      & SubscriptionFragment
    ) }> };

export type UnsubscribeMutationVariables = Exact<{
  input: UnsubscribeInput;
}>;


export type UnsubscribeMutation = { __typename?: 'Mutation', unsubscribe?: Maybe<{ __typename: 'Error', message: string } | { __typename: 'UnsubscribeSuccess', success?: Maybe<boolean> }> };

export type MyProfileQueryVariables = Exact<{ [key: string]: never; }>;


export type MyProfileQuery = { __typename?: 'Query', myProfile?: Maybe<(
    { __typename?: 'UserProfile' }
    & UserProfileFragment
  )> };

export type FindAccountQueryVariables = Exact<{
  email?: Maybe<Scalars['String']>;
  phone?: Maybe<Scalars['String']>;
}>;


export type FindAccountQuery = { __typename?: 'Query', findAccount?: Maybe<{ __typename: 'Error', message: string } | { __typename: 'NoAccountFound', success: boolean } | { __typename: 'UserAccount', username: string }> };

export const AgentFieldsFragmentDoc = gql`
    fragment AgentFields on PropertyListing {
  agentName
  agentEmail
  agentPhone
  agentPhoto
  agentLicense
  agentCompany
}
    `;
export const PropertyListingFragmentDoc = gql`
    fragment PropertyListing on PropertyListing {
  id
  createdAt
  title
  bathrooms
  bedrooms
  squareFeet
  propertyType
  price
  city {
    id
    name
    state
    stub
  }
  description
  becomesPublicAt
  daysRemaining
  location
  currentImage
  stub
  alreadyContacted
  ...AgentFields
  numberOfContacts
}
    ${AgentFieldsFragmentDoc}`;
export const CityFragmentDoc = gql`
    fragment City on City {
  id
  name
  state
  stub
  centerPoint
}
    `;
export const SubscriptionFragmentDoc = gql`
    fragment Subscription on Subscription {
  id
  type
  title
  city {
    ...City
  }
  geoName
}
    ${CityFragmentDoc}`;
export const UserProfileFragmentDoc = gql`
    fragment UserProfile on UserProfile {
  id
  firstName
  lastName
  email
  phone
  username
  subscriptions {
    ...Subscription
  }
}
    ${SubscriptionFragmentDoc}`;
export const UserAccountFragmentDoc = gql`
    fragment UserAccount on UserAccount {
  username
}
    `;
export const GetPropertiesDocument = gql`
    query getProperties($filters: PropertyFilterSetInput, $limit: Int, $offset: Int) {
  getProperties(filters: $filters, limit: $limit, offset: $offset) {
    ...PropertyListing
  }
}
    ${PropertyListingFragmentDoc}`;

/**
 * __useGetPropertiesQuery__
 *
 * To run a query within a React component, call `useGetPropertiesQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetPropertiesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetPropertiesQuery({
 *   variables: {
 *      filters: // value for 'filters'
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *   },
 * });
 */
export function useGetPropertiesQuery(baseOptions?: Apollo.QueryHookOptions<GetPropertiesQuery, GetPropertiesQueryVariables>) {
        return Apollo.useQuery<GetPropertiesQuery, GetPropertiesQueryVariables>(GetPropertiesDocument, baseOptions);
      }
export function useGetPropertiesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetPropertiesQuery, GetPropertiesQueryVariables>) {
          return Apollo.useLazyQuery<GetPropertiesQuery, GetPropertiesQueryVariables>(GetPropertiesDocument, baseOptions);
        }
export type GetPropertiesQueryHookResult = ReturnType<typeof useGetPropertiesQuery>;
export type GetPropertiesLazyQueryHookResult = ReturnType<typeof useGetPropertiesLazyQuery>;
export type GetPropertiesQueryResult = Apollo.QueryResult<GetPropertiesQuery, GetPropertiesQueryVariables>;
export const GetPropertyDocument = gql`
    query getProperty($stub: String!) {
  getProperty(stub: $stub) {
    ...PropertyListing
  }
}
    ${PropertyListingFragmentDoc}`;

/**
 * __useGetPropertyQuery__
 *
 * To run a query within a React component, call `useGetPropertyQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetPropertyQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetPropertyQuery({
 *   variables: {
 *      stub: // value for 'stub'
 *   },
 * });
 */
export function useGetPropertyQuery(baseOptions?: Apollo.QueryHookOptions<GetPropertyQuery, GetPropertyQueryVariables>) {
        return Apollo.useQuery<GetPropertyQuery, GetPropertyQueryVariables>(GetPropertyDocument, baseOptions);
      }
export function useGetPropertyLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetPropertyQuery, GetPropertyQueryVariables>) {
          return Apollo.useLazyQuery<GetPropertyQuery, GetPropertyQueryVariables>(GetPropertyDocument, baseOptions);
        }
export type GetPropertyQueryHookResult = ReturnType<typeof useGetPropertyQuery>;
export type GetPropertyLazyQueryHookResult = ReturnType<typeof useGetPropertyLazyQuery>;
export type GetPropertyQueryResult = Apollo.QueryResult<GetPropertyQuery, GetPropertyQueryVariables>;
export const GetCitiesDocument = gql`
    query getCities {
  getCities {
    ...City
  }
}
    ${CityFragmentDoc}`;

/**
 * __useGetCitiesQuery__
 *
 * To run a query within a React component, call `useGetCitiesQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetCitiesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetCitiesQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetCitiesQuery(baseOptions?: Apollo.QueryHookOptions<GetCitiesQuery, GetCitiesQueryVariables>) {
        return Apollo.useQuery<GetCitiesQuery, GetCitiesQueryVariables>(GetCitiesDocument, baseOptions);
      }
export function useGetCitiesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetCitiesQuery, GetCitiesQueryVariables>) {
          return Apollo.useLazyQuery<GetCitiesQuery, GetCitiesQueryVariables>(GetCitiesDocument, baseOptions);
        }
export type GetCitiesQueryHookResult = ReturnType<typeof useGetCitiesQuery>;
export type GetCitiesLazyQueryHookResult = ReturnType<typeof useGetCitiesLazyQuery>;
export type GetCitiesQueryResult = Apollo.QueryResult<GetCitiesQuery, GetCitiesQueryVariables>;
export const GetCityDocument = gql`
    query getCity($stub: String!) {
  getCity(stub: $stub) {
    ...City
  }
}
    ${CityFragmentDoc}`;

/**
 * __useGetCityQuery__
 *
 * To run a query within a React component, call `useGetCityQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetCityQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetCityQuery({
 *   variables: {
 *      stub: // value for 'stub'
 *   },
 * });
 */
export function useGetCityQuery(baseOptions?: Apollo.QueryHookOptions<GetCityQuery, GetCityQueryVariables>) {
        return Apollo.useQuery<GetCityQuery, GetCityQueryVariables>(GetCityDocument, baseOptions);
      }
export function useGetCityLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetCityQuery, GetCityQueryVariables>) {
          return Apollo.useLazyQuery<GetCityQuery, GetCityQueryVariables>(GetCityDocument, baseOptions);
        }
export type GetCityQueryHookResult = ReturnType<typeof useGetCityQuery>;
export type GetCityLazyQueryHookResult = ReturnType<typeof useGetCityLazyQuery>;
export type GetCityQueryResult = Apollo.QueryResult<GetCityQuery, GetCityQueryVariables>;
export const TokenAuthDocument = gql`
    mutation tokenAuth($username: String!, $password: String!) {
  tokenAuth(username: $username, password: $password) {
    token
    refreshToken
  }
}
    `;
export type TokenAuthMutationFn = Apollo.MutationFunction<TokenAuthMutation, TokenAuthMutationVariables>;

/**
 * __useTokenAuthMutation__
 *
 * To run a mutation, you first call `useTokenAuthMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useTokenAuthMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [tokenAuthMutation, { data, loading, error }] = useTokenAuthMutation({
 *   variables: {
 *      username: // value for 'username'
 *      password: // value for 'password'
 *   },
 * });
 */
export function useTokenAuthMutation(baseOptions?: Apollo.MutationHookOptions<TokenAuthMutation, TokenAuthMutationVariables>) {
        return Apollo.useMutation<TokenAuthMutation, TokenAuthMutationVariables>(TokenAuthDocument, baseOptions);
      }
export type TokenAuthMutationHookResult = ReturnType<typeof useTokenAuthMutation>;
export type TokenAuthMutationResult = Apollo.MutationResult<TokenAuthMutation>;
export type TokenAuthMutationOptions = Apollo.BaseMutationOptions<TokenAuthMutation, TokenAuthMutationVariables>;
export const RefreshTokenDocument = gql`
    mutation refreshToken($refreshToken: String!) {
  refreshToken(refreshToken: $refreshToken) {
    token
    refreshToken
    payload
  }
}
    `;
export type RefreshTokenMutationFn = Apollo.MutationFunction<RefreshTokenMutation, RefreshTokenMutationVariables>;

/**
 * __useRefreshTokenMutation__
 *
 * To run a mutation, you first call `useRefreshTokenMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRefreshTokenMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [refreshTokenMutation, { data, loading, error }] = useRefreshTokenMutation({
 *   variables: {
 *      refreshToken: // value for 'refreshToken'
 *   },
 * });
 */
export function useRefreshTokenMutation(baseOptions?: Apollo.MutationHookOptions<RefreshTokenMutation, RefreshTokenMutationVariables>) {
        return Apollo.useMutation<RefreshTokenMutation, RefreshTokenMutationVariables>(RefreshTokenDocument, baseOptions);
      }
export type RefreshTokenMutationHookResult = ReturnType<typeof useRefreshTokenMutation>;
export type RefreshTokenMutationResult = Apollo.MutationResult<RefreshTokenMutation>;
export type RefreshTokenMutationOptions = Apollo.BaseMutationOptions<RefreshTokenMutation, RefreshTokenMutationVariables>;
export const RegisterUserDocument = gql`
    mutation registerUser($input: RegisterUserInput!) {
  registerUser(input: $input) {
    __typename
    ... on UserAccount {
      username
    }
    ... on Error {
      message
    }
    ... on FieldError {
      message
      field
    }
  }
}
    `;
export type RegisterUserMutationFn = Apollo.MutationFunction<RegisterUserMutation, RegisterUserMutationVariables>;

/**
 * __useRegisterUserMutation__
 *
 * To run a mutation, you first call `useRegisterUserMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRegisterUserMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [registerUserMutation, { data, loading, error }] = useRegisterUserMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useRegisterUserMutation(baseOptions?: Apollo.MutationHookOptions<RegisterUserMutation, RegisterUserMutationVariables>) {
        return Apollo.useMutation<RegisterUserMutation, RegisterUserMutationVariables>(RegisterUserDocument, baseOptions);
      }
export type RegisterUserMutationHookResult = ReturnType<typeof useRegisterUserMutation>;
export type RegisterUserMutationResult = Apollo.MutationResult<RegisterUserMutation>;
export type RegisterUserMutationOptions = Apollo.BaseMutationOptions<RegisterUserMutation, RegisterUserMutationVariables>;
export const SendLoginCodeDocument = gql`
    mutation sendLoginCode($input: SendLoginCodeInput!) {
  sendLoginCode(input: $input) {
    __typename
    ... on SendLoginCodeSuccess {
      user {
        username
      }
      validForMinutes
      deliveryMethod
    }
    ... on Error {
      message
    }
  }
}
    `;
export type SendLoginCodeMutationFn = Apollo.MutationFunction<SendLoginCodeMutation, SendLoginCodeMutationVariables>;

/**
 * __useSendLoginCodeMutation__
 *
 * To run a mutation, you first call `useSendLoginCodeMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSendLoginCodeMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [sendLoginCodeMutation, { data, loading, error }] = useSendLoginCodeMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useSendLoginCodeMutation(baseOptions?: Apollo.MutationHookOptions<SendLoginCodeMutation, SendLoginCodeMutationVariables>) {
        return Apollo.useMutation<SendLoginCodeMutation, SendLoginCodeMutationVariables>(SendLoginCodeDocument, baseOptions);
      }
export type SendLoginCodeMutationHookResult = ReturnType<typeof useSendLoginCodeMutation>;
export type SendLoginCodeMutationResult = Apollo.MutationResult<SendLoginCodeMutation>;
export type SendLoginCodeMutationOptions = Apollo.BaseMutationOptions<SendLoginCodeMutation, SendLoginCodeMutationVariables>;
export const UpdateProfileDocument = gql`
    mutation updateProfile($input: UpdateProfileInput!) {
  updateProfile(input: $input) {
    __typename
    ... on UserProfile {
      ...UserProfile
    }
    ... on Error {
      message
    }
  }
}
    ${UserProfileFragmentDoc}`;
export type UpdateProfileMutationFn = Apollo.MutationFunction<UpdateProfileMutation, UpdateProfileMutationVariables>;

/**
 * __useUpdateProfileMutation__
 *
 * To run a mutation, you first call `useUpdateProfileMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateProfileMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateProfileMutation, { data, loading, error }] = useUpdateProfileMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateProfileMutation(baseOptions?: Apollo.MutationHookOptions<UpdateProfileMutation, UpdateProfileMutationVariables>) {
        return Apollo.useMutation<UpdateProfileMutation, UpdateProfileMutationVariables>(UpdateProfileDocument, baseOptions);
      }
export type UpdateProfileMutationHookResult = ReturnType<typeof useUpdateProfileMutation>;
export type UpdateProfileMutationResult = Apollo.MutationResult<UpdateProfileMutation>;
export type UpdateProfileMutationOptions = Apollo.BaseMutationOptions<UpdateProfileMutation, UpdateProfileMutationVariables>;
export const ContactPropertyDocument = gql`
    mutation contactProperty($input: ContactPropertyInput!) {
  contactProperty(input: $input) {
    __typename
    ... on ContactPropertySuccess {
      property {
        ...PropertyListing
      }
    }
    ... on Error {
      message
    }
  }
}
    ${PropertyListingFragmentDoc}`;
export type ContactPropertyMutationFn = Apollo.MutationFunction<ContactPropertyMutation, ContactPropertyMutationVariables>;

/**
 * __useContactPropertyMutation__
 *
 * To run a mutation, you first call `useContactPropertyMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useContactPropertyMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [contactPropertyMutation, { data, loading, error }] = useContactPropertyMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useContactPropertyMutation(baseOptions?: Apollo.MutationHookOptions<ContactPropertyMutation, ContactPropertyMutationVariables>) {
        return Apollo.useMutation<ContactPropertyMutation, ContactPropertyMutationVariables>(ContactPropertyDocument, baseOptions);
      }
export type ContactPropertyMutationHookResult = ReturnType<typeof useContactPropertyMutation>;
export type ContactPropertyMutationResult = Apollo.MutationResult<ContactPropertyMutation>;
export type ContactPropertyMutationOptions = Apollo.BaseMutationOptions<ContactPropertyMutation, ContactPropertyMutationVariables>;
export const SubscribeDocument = gql`
    mutation subscribe($input: SubscribeInput!) {
  subscribe(input: $input) {
    __typename
    ... on SubscribeSuccess {
      subscription {
        ...Subscription
      }
    }
    ... on Error {
      message
    }
  }
}
    ${SubscriptionFragmentDoc}`;
export type SubscribeMutationFn = Apollo.MutationFunction<SubscribeMutation, SubscribeMutationVariables>;

/**
 * __useSubscribeMutation__
 *
 * To run a mutation, you first call `useSubscribeMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSubscribeMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [subscribeMutation, { data, loading, error }] = useSubscribeMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useSubscribeMutation(baseOptions?: Apollo.MutationHookOptions<SubscribeMutation, SubscribeMutationVariables>) {
        return Apollo.useMutation<SubscribeMutation, SubscribeMutationVariables>(SubscribeDocument, baseOptions);
      }
export type SubscribeMutationHookResult = ReturnType<typeof useSubscribeMutation>;
export type SubscribeMutationResult = Apollo.MutationResult<SubscribeMutation>;
export type SubscribeMutationOptions = Apollo.BaseMutationOptions<SubscribeMutation, SubscribeMutationVariables>;
export const UnsubscribeDocument = gql`
    mutation unsubscribe($input: UnsubscribeInput!) {
  unsubscribe(input: $input) {
    __typename
    ... on UnsubscribeSuccess {
      success
    }
    ... on Error {
      message
    }
  }
}
    `;
export type UnsubscribeMutationFn = Apollo.MutationFunction<UnsubscribeMutation, UnsubscribeMutationVariables>;

/**
 * __useUnsubscribeMutation__
 *
 * To run a mutation, you first call `useUnsubscribeMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUnsubscribeMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [unsubscribeMutation, { data, loading, error }] = useUnsubscribeMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUnsubscribeMutation(baseOptions?: Apollo.MutationHookOptions<UnsubscribeMutation, UnsubscribeMutationVariables>) {
        return Apollo.useMutation<UnsubscribeMutation, UnsubscribeMutationVariables>(UnsubscribeDocument, baseOptions);
      }
export type UnsubscribeMutationHookResult = ReturnType<typeof useUnsubscribeMutation>;
export type UnsubscribeMutationResult = Apollo.MutationResult<UnsubscribeMutation>;
export type UnsubscribeMutationOptions = Apollo.BaseMutationOptions<UnsubscribeMutation, UnsubscribeMutationVariables>;
export const MyProfileDocument = gql`
    query myProfile {
  myProfile {
    ...UserProfile
  }
}
    ${UserProfileFragmentDoc}`;

/**
 * __useMyProfileQuery__
 *
 * To run a query within a React component, call `useMyProfileQuery` and pass it any options that fit your needs.
 * When your component renders, `useMyProfileQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMyProfileQuery({
 *   variables: {
 *   },
 * });
 */
export function useMyProfileQuery(baseOptions?: Apollo.QueryHookOptions<MyProfileQuery, MyProfileQueryVariables>) {
        return Apollo.useQuery<MyProfileQuery, MyProfileQueryVariables>(MyProfileDocument, baseOptions);
      }
export function useMyProfileLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<MyProfileQuery, MyProfileQueryVariables>) {
          return Apollo.useLazyQuery<MyProfileQuery, MyProfileQueryVariables>(MyProfileDocument, baseOptions);
        }
export type MyProfileQueryHookResult = ReturnType<typeof useMyProfileQuery>;
export type MyProfileLazyQueryHookResult = ReturnType<typeof useMyProfileLazyQuery>;
export type MyProfileQueryResult = Apollo.QueryResult<MyProfileQuery, MyProfileQueryVariables>;
export const FindAccountDocument = gql`
    query findAccount($email: String, $phone: String) {
  findAccount(email: $email, phone: $phone) {
    __typename
    ... on UserAccount {
      username
    }
    ... on NoAccountFound {
      success
    }
    ... on Error {
      message
    }
  }
}
    `;

/**
 * __useFindAccountQuery__
 *
 * To run a query within a React component, call `useFindAccountQuery` and pass it any options that fit your needs.
 * When your component renders, `useFindAccountQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useFindAccountQuery({
 *   variables: {
 *      email: // value for 'email'
 *      phone: // value for 'phone'
 *   },
 * });
 */
export function useFindAccountQuery(baseOptions?: Apollo.QueryHookOptions<FindAccountQuery, FindAccountQueryVariables>) {
        return Apollo.useQuery<FindAccountQuery, FindAccountQueryVariables>(FindAccountDocument, baseOptions);
      }
export function useFindAccountLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<FindAccountQuery, FindAccountQueryVariables>) {
          return Apollo.useLazyQuery<FindAccountQuery, FindAccountQueryVariables>(FindAccountDocument, baseOptions);
        }
export type FindAccountQueryHookResult = ReturnType<typeof useFindAccountQuery>;
export type FindAccountLazyQueryHookResult = ReturnType<typeof useFindAccountLazyQuery>;
export type FindAccountQueryResult = Apollo.QueryResult<FindAccountQuery, FindAccountQueryVariables>;