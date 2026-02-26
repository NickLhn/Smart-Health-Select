import request from './request'

export interface OcrField {
  value?: string
  confidence?: number
}

export interface BusinessLicenseOcrResult {
  creditCode?: OcrField
  address?: OcrField
  entityName?: OcrField
}

export interface IdCardOcrResult {
  name?: OcrField
  idNumber?: OcrField
  address?: OcrField
  authority?: OcrField
  validDate?: OcrField
}

export async function ocrBusinessLicense(imageUrl: string) {
  return request.post<BusinessLicenseOcrResult>('/merchant/ocr/business-license', { imageUrl })
}

export async function ocrIdCardBundle(frontImageUrl: string, backImageUrl: string) {
  return request.post<IdCardOcrResult>('/merchant/ocr/idcard-bundle', { frontImageUrl, backImageUrl })
}

