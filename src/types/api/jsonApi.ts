export type JsonApiResource<TType extends string, TAttributes> = {
  id: string
  type: TType
  attributes: TAttributes
}

export type JsonApiObjectResponse<TResource> = {
  status: 'success'
  type: 'object'
  message?: string
  data: TResource
}

export type JsonApiCreateResponse<TResource> = JsonApiObjectResponse<TResource> & {
  message: string
}
