import request from './request'

// 商家入驻 OCR 接口，识别营业执照和身份证信息。
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

// 营业执照识别。
export async function ocrBusinessLicense(imageUrl: string) {
  return request.post<BusinessLicenseOcrResult>('/merchant/ocr/business-license', { imageUrl })
}

// 身份证正反面合并识别。
export async function ocrIdCardBundle(frontImageUrl: string, backImageUrl: string) {
  return request.get<IdCardOcrResult>('/merchant/ocr/idcard-bundle', {
    params: { frontImageUrl, backImageUrl },
  })
}
