import axios, { AxiosResponse } from "axios"


export function getACT(){
    return localStorage.getItem('monagree_rest_act') ?? ''
  }

export class makeRequest{
    endpoint:string;

    constructor(endpoint:string){
        this.endpoint = endpoint;
    }

    /**
   * Make a POST request. 
   * - Dont lead the path with "/"
   * 
   * - Set isAuth to true if this is an authenticaton endpoint. Specify the tokenFieldName (default is token)
   *   so we automatically extract the token for other requests
   * 
   * - The callback is a function (not a promise)
   */
    post(path:string,data:any,callback:(task:resHandler)=>void,isAuth?:boolean, tokenFieldName?:string){
        axios.post(`${this.endpoint}/${path}`, data, {headers:{
            "Content-Type":'application/json',
            Authorization:`Bearer ${getACT()}`
        }}).then(response => {
            callback(new resHandler(response,isAuth,tokenFieldName))
        })
        .catch(error => {
            console.error('Error:', error);
            console.log('Response:', error.response);
            callback(new resHandler(error.response))
        });
    }

    /**
   * Make a GET request. Dont lead the path with /
   * 
   * - The callback is a function (not a promise)
   */
    get(path:string,params:any,callback:(task:resHandler)=>void){
        axios.get(`${this.endpoint}/${path}`,{params:params, headers:{
            "Content-Type":'application/json',
            Authorization:`Bearer ${getACT()}`
        }})
        .then(response => {
            callback(new resHandler(response))
        })
        .catch(error => {
            console.error('Error:', error);
            console.log('Response:', error.response);
            callback(new resHandler(error.response))
        });
    }

    /**
   * Upload File. Make sure the endpoint fits your purpose b4 use
   * 
   * - The callback is a function (not a promise)
   */
    uploadFile(folder:string, filename:string,file:File,finise:(task:resHandler)=>void){
        const formData = new FormData();
        formData.append('file', file);
        formData.append('filename', filename);
        formData.append('folder', folder);

        axios.post(`${this.endpoint}/uploadFile`, formData, {
            headers: {
            'Content-Type': 'multipart/form-data',
            Authorization:`Bearer ${getACT()}`
            },
        }).then((response)=>{
            finise(new resHandler(response,false))
        }).catch((e)=>{
            console.error('Error uploading file:', e);
            finise(new resHandler(e.response))
        })
    }

}

export class resHandler{
    response?: AxiosResponse<any, any>
    constructor(response?: AxiosResponse<any, any>,isAuth?:boolean,tokenFieldName?:string){
        this.response = response
        if(isAuth && this.isSuccessful()){
            localStorage.setItem('monagree_rest_act',response!.data[tokenFieldName || 'token'])
        }
    }

    /**
   * get the payload. You may include payloadId if the id is different from "pld"
   * 
   * - Make sue to ask if it was even successful and it exists
   */
    getData(payloadId?:string){
        return this.response!.data[payloadId??'pld']
    }
    /**
   * Check if data exists. You may include payloadId if the id is different from "pld"
   * 
   * - Make sue to ask if it was even successful
   */
    exists(payloadId?:string){
        return this.response?.data[payloadId || 'pld'] != undefined && this.response?.data[payloadId || 'pld'] != null
    }
    /**
   * Check if request was successful
   */
    isSuccessful(){
        return this.response && this.response.status == 200 && (this.response.data.status as boolean)
    }
    /**
   * Check if request was unsuccessful because the user has been logged out
   */
    isLoggedOut(){
        return (this.response?.status ?? 0) == 401
    }
    /**
   * Get error message
   */
    getErrorMsg(){
        if(!this.response){
            return 'An error occurred'
        }
        if(this.response.status == 200){
            return this.response.data.message
        }else{
            console.error(this.response.data)
            return this.response.data.message ?? `Request Failed (${this.response.status})`
        }
    }
  }