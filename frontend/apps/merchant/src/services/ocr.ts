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
  idNumberLast4?: string
  idNumberHash?: string
  address?: OcrField
  authority?: OcrField
  validDate?: OcrField
  validFrom?: string
  validTo?: string
  validLongTerm?: boolean
}

export async function ocrBusinessLicense(imageUrl: string) {
  return request.post<BusinessLicenseOcrResult>('/merchant/ocr/business-license', { imageUrl })
}

export async function ocrIdCardBundle(frontImageUrl: string, backImageUrl: string) {
  return request.get<IdCardOcrResult>('/merchant/ocr/idcard-bundle', {
    params: { frontImageUrl, backImageUrl },
  })
}
