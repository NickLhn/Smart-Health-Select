# 智健优选 API 接口文档


**简介**:智健优选 API 接口文档


**HOST**:http://localhost:8080


**联系人**:TraeAI


**Version**:1.0


**接口路径**:/v3/api-docs


[TOC]






# 认证管理


## 重置密码


**接口地址**:`/auth/reset-password`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:


**请求示例**:


```javascript
{
  "mobile": "13800138000",
  "captcha": "123456",
  "newPassword": "123456",
  "role": "USER"
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|userResetPasswordDTO|用户重置密码请求参数|body|true|UserResetPasswordDTO|UserResetPasswordDTO|
|&emsp;&emsp;mobile|手机号||true|string||
|&emsp;&emsp;captcha|验证码||true|string||
|&emsp;&emsp;newPassword|新密码||true|string||
|&emsp;&emsp;role|角色||false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|Result|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||object||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {}
}
```


## 用户注册


**接口地址**:`/auth/register`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:


**请求示例**:


```javascript
{
  "username": "testuser",
  "password": "123456",
  "mobile": "13800138000",
  "role": "USER"
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|userRegisterDTO|用户注册请求参数|body|true|UserRegisterDTO|UserRegisterDTO|
|&emsp;&emsp;username|用户名||true|string||
|&emsp;&emsp;password|密码||true|string||
|&emsp;&emsp;mobile|手机号||true|string||
|&emsp;&emsp;role|角色 (USER/SELLER/RIDER)||true|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|Result|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||object||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {}
}
```


## 用户登录


**接口地址**:`/auth/login`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:


**请求示例**:


```javascript
{
  "username": "admin",
  "password": "123456",
  "mobile": "13800138000",
  "captcha": "123456",
  "role": "USER"
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|userLoginDTO|用户登录请求参数|body|true|UserLoginDTO|UserLoginDTO|
|&emsp;&emsp;username|用户名||false|string||
|&emsp;&emsp;password|密码||false|string||
|&emsp;&emsp;mobile|手机号||false|string||
|&emsp;&emsp;captcha|验证码||false|string||
|&emsp;&emsp;role|角色||false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|Result|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||object||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {}
}
```


# 药品管理


## 获取药品详情


**接口地址**:`/medicine/{id}`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|id||path|true|integer(int64)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultMedicine|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||Medicine|Medicine|
|&emsp;&emsp;id||integer(int64)||
|&emsp;&emsp;name||string||
|&emsp;&emsp;categoryId||integer(int64)||
|&emsp;&emsp;categoryName||string||
|&emsp;&emsp;mainImage||string||
|&emsp;&emsp;price||number||
|&emsp;&emsp;stock||integer(int32)||
|&emsp;&emsp;sales||integer(int32)||
|&emsp;&emsp;isPrescription||integer(int32)||
|&emsp;&emsp;indication||string||
|&emsp;&emsp;usageMethod||string||
|&emsp;&emsp;contraindication||string||
|&emsp;&emsp;expiryDate||string(date)||
|&emsp;&emsp;productionDate||string(date)||
|&emsp;&emsp;sellerId||integer(int64)||
|&emsp;&emsp;sellerName||string||
|&emsp;&emsp;status||integer(int32)||
|&emsp;&emsp;createTime||string(date-time)||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {
		"id": 0,
		"name": "",
		"categoryId": 0,
		"categoryName": "",
		"mainImage": "",
		"price": 0,
		"stock": 0,
		"sales": 0,
		"isPrescription": 0,
		"indication": "",
		"usageMethod": "",
		"contraindication": "",
		"expiryDate": "",
		"productionDate": "",
		"sellerId": 0,
		"sellerName": "",
		"status": 0,
		"createTime": ""
	}
}
```


## 修改药品 (商家)


**接口地址**:`/medicine/{id}`


**请求方式**:`PUT`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:


**请求示例**:


```javascript
{
  "name": "",
  "categoryId": 0,
  "mainImage": "",
  "price": 0,
  "stock": 0,
  "isPrescription": 0,
  "indication": "",
  "usageMethod": "",
  "contraindication": "",
  "expiryDate": "",
  "productionDate": ""
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|id||path|true|integer(int64)||
|medicineDTO|药品信息参数|body|true|MedicineDTO|MedicineDTO|
|&emsp;&emsp;name|药品名称||true|string||
|&emsp;&emsp;categoryId|分类ID||true|integer(int64)||
|&emsp;&emsp;mainImage|主图URL||false|string||
|&emsp;&emsp;price|价格||true|number||
|&emsp;&emsp;stock|库存||true|integer(int32)||
|&emsp;&emsp;isPrescription|是否处方药 (1是 0否)||true|integer(int32)||
|&emsp;&emsp;indication|适应症||false|string||
|&emsp;&emsp;usageMethod|用法用量||false|string||
|&emsp;&emsp;contraindication|禁忌||false|string||
|&emsp;&emsp;expiryDate|有效期至 (yyyy-MM-dd)||true|string(date)||
|&emsp;&emsp;productionDate|生产日期 (yyyy-MM-dd)||true|string(date)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|Result|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||object||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {}
}
```


## 发布药品 (商家)


**接口地址**:`/medicine`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:


**请求示例**:


```javascript
{
  "name": "",
  "categoryId": 0,
  "mainImage": "",
  "price": 0,
  "stock": 0,
  "isPrescription": 0,
  "indication": "",
  "usageMethod": "",
  "contraindication": "",
  "expiryDate": "",
  "productionDate": ""
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|medicineDTO|药品信息参数|body|true|MedicineDTO|MedicineDTO|
|&emsp;&emsp;name|药品名称||true|string||
|&emsp;&emsp;categoryId|分类ID||true|integer(int64)||
|&emsp;&emsp;mainImage|主图URL||false|string||
|&emsp;&emsp;price|价格||true|number||
|&emsp;&emsp;stock|库存||true|integer(int32)||
|&emsp;&emsp;isPrescription|是否处方药 (1是 0否)||true|integer(int32)||
|&emsp;&emsp;indication|适应症||false|string||
|&emsp;&emsp;usageMethod|用法用量||false|string||
|&emsp;&emsp;contraindication|禁忌||false|string||
|&emsp;&emsp;expiryDate|有效期至 (yyyy-MM-dd)||true|string(date)||
|&emsp;&emsp;productionDate|生产日期 (yyyy-MM-dd)||true|string(date)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|Result|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||object||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {}
}
```


## 药品上下架 (商家)


**接口地址**:`/medicine/{id}/status`


**请求方式**:`PATCH`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|id||path|true|integer(int64)||
|status||query|true|integer(int32)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|Result|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||object||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {}
}
```


## 修改药品状态 (管理端)


**接口地址**:`/medicine/admin/{id}/status`


**请求方式**:`PATCH`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|id||path|true|integer(int64)||
|status||query|true|integer(int32)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|Result|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||object||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {}
}
```


## 分页搜索药品 (用户-公开)


**接口地址**:`/medicine/list`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|query|药品查询参数|query|true|MedicineQueryDTO|MedicineQueryDTO|
|&emsp;&emsp;keyword|药品名称(模糊查询)||false|string||
|&emsp;&emsp;categoryId|分类ID||false|integer(int64)||
|&emsp;&emsp;isPrescription|是否处方药||false|integer(int32)||
|&emsp;&emsp;sortBy|排序字段: price(价格), sales(销量)||false|string||
|&emsp;&emsp;sortOrder|排序方式: asc(升序), desc(降序)||false|string||
|&emsp;&emsp;status|状态: 1上架 0下架 (仅管理员可用)||false|integer(int32)||
|&emsp;&emsp;page|页码||false|integer(int32)||
|&emsp;&emsp;size|每页大小||false|integer(int32)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultIPageMedicine|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||IPageMedicine|IPageMedicine|
|&emsp;&emsp;size||integer(int64)||
|&emsp;&emsp;current||integer(int64)||
|&emsp;&emsp;records||array|Medicine|
|&emsp;&emsp;&emsp;&emsp;id||integer||
|&emsp;&emsp;&emsp;&emsp;name||string||
|&emsp;&emsp;&emsp;&emsp;categoryId||integer||
|&emsp;&emsp;&emsp;&emsp;categoryName||string||
|&emsp;&emsp;&emsp;&emsp;mainImage||string||
|&emsp;&emsp;&emsp;&emsp;price||number||
|&emsp;&emsp;&emsp;&emsp;stock||integer||
|&emsp;&emsp;&emsp;&emsp;sales||integer||
|&emsp;&emsp;&emsp;&emsp;isPrescription||integer||
|&emsp;&emsp;&emsp;&emsp;indication||string||
|&emsp;&emsp;&emsp;&emsp;usageMethod||string||
|&emsp;&emsp;&emsp;&emsp;contraindication||string||
|&emsp;&emsp;&emsp;&emsp;expiryDate||string||
|&emsp;&emsp;&emsp;&emsp;productionDate||string||
|&emsp;&emsp;&emsp;&emsp;sellerId||integer||
|&emsp;&emsp;&emsp;&emsp;sellerName||string||
|&emsp;&emsp;&emsp;&emsp;status||integer||
|&emsp;&emsp;&emsp;&emsp;createTime||string||
|&emsp;&emsp;pages||integer(int64)||
|&emsp;&emsp;total||integer(int64)||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {
		"size": 0,
		"current": 0,
		"records": [
			{
				"id": 0,
				"name": "",
				"categoryId": 0,
				"categoryName": "",
				"mainImage": "",
				"price": 0,
				"stock": 0,
				"sales": 0,
				"isPrescription": 0,
				"indication": "",
				"usageMethod": "",
				"contraindication": "",
				"expiryDate": "",
				"productionDate": "",
				"sellerId": 0,
				"sellerName": "",
				"status": 0,
				"createTime": ""
			}
		],
		"pages": 0,
		"total": 0
	}
}
```


## 获取我的足迹


**接口地址**:`/medicine/footprints`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|page||query|false|integer(int32)||
|size||query|false|integer(int32)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultIPageMedicine|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||IPageMedicine|IPageMedicine|
|&emsp;&emsp;size||integer(int64)||
|&emsp;&emsp;current||integer(int64)||
|&emsp;&emsp;records||array|Medicine|
|&emsp;&emsp;&emsp;&emsp;id||integer||
|&emsp;&emsp;&emsp;&emsp;name||string||
|&emsp;&emsp;&emsp;&emsp;categoryId||integer||
|&emsp;&emsp;&emsp;&emsp;categoryName||string||
|&emsp;&emsp;&emsp;&emsp;mainImage||string||
|&emsp;&emsp;&emsp;&emsp;price||number||
|&emsp;&emsp;&emsp;&emsp;stock||integer||
|&emsp;&emsp;&emsp;&emsp;sales||integer||
|&emsp;&emsp;&emsp;&emsp;isPrescription||integer||
|&emsp;&emsp;&emsp;&emsp;indication||string||
|&emsp;&emsp;&emsp;&emsp;usageMethod||string||
|&emsp;&emsp;&emsp;&emsp;contraindication||string||
|&emsp;&emsp;&emsp;&emsp;expiryDate||string||
|&emsp;&emsp;&emsp;&emsp;productionDate||string||
|&emsp;&emsp;&emsp;&emsp;sellerId||integer||
|&emsp;&emsp;&emsp;&emsp;sellerName||string||
|&emsp;&emsp;&emsp;&emsp;status||integer||
|&emsp;&emsp;&emsp;&emsp;createTime||string||
|&emsp;&emsp;pages||integer(int64)||
|&emsp;&emsp;total||integer(int64)||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {
		"size": 0,
		"current": 0,
		"records": [
			{
				"id": 0,
				"name": "",
				"categoryId": 0,
				"categoryName": "",
				"mainImage": "",
				"price": 0,
				"stock": 0,
				"sales": 0,
				"isPrescription": 0,
				"indication": "",
				"usageMethod": "",
				"contraindication": "",
				"expiryDate": "",
				"productionDate": "",
				"sellerId": 0,
				"sellerName": "",
				"status": 0,
				"createTime": ""
			}
		],
		"pages": 0,
		"total": 0
	}
}
```


## 分页搜索药品 (管理端)


**接口地址**:`/medicine/admin/list`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|query|药品查询参数|query|true|MedicineQueryDTO|MedicineQueryDTO|
|&emsp;&emsp;keyword|药品名称(模糊查询)||false|string||
|&emsp;&emsp;categoryId|分类ID||false|integer(int64)||
|&emsp;&emsp;isPrescription|是否处方药||false|integer(int32)||
|&emsp;&emsp;sortBy|排序字段: price(价格), sales(销量)||false|string||
|&emsp;&emsp;sortOrder|排序方式: asc(升序), desc(降序)||false|string||
|&emsp;&emsp;status|状态: 1上架 0下架 (仅管理员可用)||false|integer(int32)||
|&emsp;&emsp;page|页码||false|integer(int32)||
|&emsp;&emsp;size|每页大小||false|integer(int32)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultIPageMedicine|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||IPageMedicine|IPageMedicine|
|&emsp;&emsp;size||integer(int64)||
|&emsp;&emsp;current||integer(int64)||
|&emsp;&emsp;records||array|Medicine|
|&emsp;&emsp;&emsp;&emsp;id||integer||
|&emsp;&emsp;&emsp;&emsp;name||string||
|&emsp;&emsp;&emsp;&emsp;categoryId||integer||
|&emsp;&emsp;&emsp;&emsp;categoryName||string||
|&emsp;&emsp;&emsp;&emsp;mainImage||string||
|&emsp;&emsp;&emsp;&emsp;price||number||
|&emsp;&emsp;&emsp;&emsp;stock||integer||
|&emsp;&emsp;&emsp;&emsp;sales||integer||
|&emsp;&emsp;&emsp;&emsp;isPrescription||integer||
|&emsp;&emsp;&emsp;&emsp;indication||string||
|&emsp;&emsp;&emsp;&emsp;usageMethod||string||
|&emsp;&emsp;&emsp;&emsp;contraindication||string||
|&emsp;&emsp;&emsp;&emsp;expiryDate||string||
|&emsp;&emsp;&emsp;&emsp;productionDate||string||
|&emsp;&emsp;&emsp;&emsp;sellerId||integer||
|&emsp;&emsp;&emsp;&emsp;sellerName||string||
|&emsp;&emsp;&emsp;&emsp;status||integer||
|&emsp;&emsp;&emsp;&emsp;createTime||string||
|&emsp;&emsp;pages||integer(int64)||
|&emsp;&emsp;total||integer(int64)||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {
		"size": 0,
		"current": 0,
		"records": [
			{
				"id": 0,
				"name": "",
				"categoryId": 0,
				"categoryName": "",
				"mainImage": "",
				"price": 0,
				"stock": 0,
				"sales": 0,
				"isPrescription": 0,
				"indication": "",
				"usageMethod": "",
				"contraindication": "",
				"expiryDate": "",
				"productionDate": "",
				"sellerId": 0,
				"sellerName": "",
				"status": 0,
				"createTime": ""
			}
		],
		"pages": 0,
		"total": 0
	}
}
```


## 删除药品 (管理端)


**接口地址**:`/medicine/admin/{id}`


**请求方式**:`DELETE`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|id||path|true|integer(int64)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|Result|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||object||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {}
}
```


# 个人中心


## 获取个人信息


**接口地址**:`/user/profile`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


暂无


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultSysUser|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||SysUser|SysUser|
|&emsp;&emsp;id|用户ID|integer(int64)||
|&emsp;&emsp;username|用户名|string||
|&emsp;&emsp;password|密码(加密)|string||
|&emsp;&emsp;nickname|昵称|string||
|&emsp;&emsp;mobile|手机号|string||
|&emsp;&emsp;role|角色|string||
|&emsp;&emsp;avatar|头像URL|string||
|&emsp;&emsp;status|状态: 1正常 0禁用|integer(int32)||
|&emsp;&emsp;createTime|创建时间|string(date-time)||
|&emsp;&emsp;updateTime|更新时间|string(date-time)||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {
		"id": 0,
		"username": "",
		"password": "",
		"nickname": "",
		"mobile": "",
		"role": "",
		"avatar": "",
		"status": 0,
		"createTime": "",
		"updateTime": ""
	}
}
```


## 修改个人资料


**接口地址**:`/user/profile`


**请求方式**:`PUT`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:


**请求示例**:


```javascript
{
  "nickname": "",
  "mobile": "",
  "avatar": ""
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|userUpdateDTO|用户信息更新参数|body|true|UserUpdateDTO|UserUpdateDTO|
|&emsp;&emsp;nickname|昵称||false|string||
|&emsp;&emsp;mobile|手机号||false|string||
|&emsp;&emsp;avatar|头像||false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|Result|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||object||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {}
}
```


## 修改密码


**接口地址**:`/user/password`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:


**请求示例**:


```javascript
{
  "oldPassword": "",
  "newPassword": ""
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|passwordUpdateDTO|修改密码参数|body|true|PasswordUpdateDTO|PasswordUpdateDTO|
|&emsp;&emsp;oldPassword|旧密码||true|string||
|&emsp;&emsp;newPassword|新密码||true|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|Result|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||object||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {}
}
```


## 管理端-更新状态


**接口地址**:`/user/admin/{id}/status`


**请求方式**:`PATCH`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|id||path|true|integer(int64)||
|status||query|true|integer(int32)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|Result|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||object||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {}
}
```


## 管理端-用户列表


**接口地址**:`/user/admin/list`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|query|用户查询参数|query|true|UserQueryDTO|UserQueryDTO|
|&emsp;&emsp;page|页码||false|integer(int32)||
|&emsp;&emsp;size|每页大小||false|integer(int32)||
|&emsp;&emsp;keyword|关键词(用户名/昵称/手机号)||false|string||
|&emsp;&emsp;role|角色||false|string||
|&emsp;&emsp;status|状态(0:禁用 1:正常)||false|integer(int32)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultIPageSysUser|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||IPageSysUser|IPageSysUser|
|&emsp;&emsp;size||integer(int64)||
|&emsp;&emsp;current||integer(int64)||
|&emsp;&emsp;records|用户信息|array|SysUser|
|&emsp;&emsp;&emsp;&emsp;id|用户ID|integer||
|&emsp;&emsp;&emsp;&emsp;username|用户名|string||
|&emsp;&emsp;&emsp;&emsp;password|密码(加密)|string||
|&emsp;&emsp;&emsp;&emsp;nickname|昵称|string||
|&emsp;&emsp;&emsp;&emsp;mobile|手机号|string||
|&emsp;&emsp;&emsp;&emsp;role|角色|string||
|&emsp;&emsp;&emsp;&emsp;avatar|头像URL|string||
|&emsp;&emsp;&emsp;&emsp;status|状态: 1正常 0禁用|integer||
|&emsp;&emsp;&emsp;&emsp;createTime|创建时间|string||
|&emsp;&emsp;&emsp;&emsp;updateTime|更新时间|string||
|&emsp;&emsp;pages||integer(int64)||
|&emsp;&emsp;total||integer(int64)||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {
		"size": 0,
		"current": 0,
		"records": [
			{
				"id": 0,
				"username": "",
				"password": "",
				"nickname": "",
				"mobile": "",
				"role": "",
				"avatar": "",
				"status": 0,
				"createTime": "",
				"updateTime": ""
			}
		],
		"pages": 0,
		"total": 0
	}
}
```


# 就诊人管理


## 修改就诊人


**接口地址**:`/user/patient/update`


**请求方式**:`PUT`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:


**请求示例**:


```javascript
{
  "id": 0,
  "name": "",
  "idCard": "",
  "phone": "",
  "gender": 0,
  "birthday": "",
  "isDefault": 0
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|patientUpdateDTO|修改就诊人请求参数|body|true|PatientUpdateDTO|PatientUpdateDTO|
|&emsp;&emsp;id|就诊人ID||false|integer(int64)||
|&emsp;&emsp;name|姓名||false|string||
|&emsp;&emsp;idCard|身份证号||false|string||
|&emsp;&emsp;phone|手机号||false|string||
|&emsp;&emsp;gender|性别(0-未知 1-男 2-女)||false|integer(int32)||
|&emsp;&emsp;birthday|出生日期||false|string(date)||
|&emsp;&emsp;isDefault|是否默认(0-否 1-是)||false|integer(int32)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultBoolean|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||boolean||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": true
}
```


## 添加就诊人


**接口地址**:`/user/patient/add`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:


**请求示例**:


```javascript
{
  "name": "",
  "idCard": "",
  "phone": "",
  "gender": 0,
  "birthday": "",
  "isDefault": 0
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|patientAddDTO|添加就诊人请求参数|body|true|PatientAddDTO|PatientAddDTO|
|&emsp;&emsp;name|姓名||false|string||
|&emsp;&emsp;idCard|身份证号||false|string||
|&emsp;&emsp;phone|手机号||false|string||
|&emsp;&emsp;gender|性别(0-未知 1-男 2-女)||false|integer(int32)||
|&emsp;&emsp;birthday|出生日期||false|string(date)||
|&emsp;&emsp;isDefault|是否默认(0-否 1-是)||false|integer(int32)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultBoolean|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||boolean||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": true
}
```


## 获取就诊人详情


**接口地址**:`/user/patient/{id}`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|id||path|true|integer(int64)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultPatient|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||Patient|Patient|
|&emsp;&emsp;id|主键ID|integer(int64)||
|&emsp;&emsp;userId|用户ID|integer(int64)||
|&emsp;&emsp;name|姓名|string||
|&emsp;&emsp;idCard|身份证号|string||
|&emsp;&emsp;phone|手机号|string||
|&emsp;&emsp;gender|性别(0-未知 1-男 2-女)|integer(int32)||
|&emsp;&emsp;birthday|出生日期|string(date)||
|&emsp;&emsp;isDefault|是否默认(0-否 1-是)|integer(int32)||
|&emsp;&emsp;createTime|创建时间|string(date-time)||
|&emsp;&emsp;updateTime|更新时间|string(date-time)||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {
		"id": 0,
		"userId": 0,
		"name": "",
		"idCard": "",
		"phone": "",
		"gender": 0,
		"birthday": "",
		"isDefault": 0,
		"createTime": "",
		"updateTime": ""
	}
}
```


## 获取我的就诊人列表


**接口地址**:`/user/patient/list`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


暂无


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultListPatient|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||array|Patient|
|&emsp;&emsp;id|主键ID|integer(int64)||
|&emsp;&emsp;userId|用户ID|integer(int64)||
|&emsp;&emsp;name|姓名|string||
|&emsp;&emsp;idCard|身份证号|string||
|&emsp;&emsp;phone|手机号|string||
|&emsp;&emsp;gender|性别(0-未知 1-男 2-女)|integer(int32)||
|&emsp;&emsp;birthday|出生日期|string(date)||
|&emsp;&emsp;isDefault|是否默认(0-否 1-是)|integer(int32)||
|&emsp;&emsp;createTime|创建时间|string(date-time)||
|&emsp;&emsp;updateTime|更新时间|string(date-time)||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": [
		{
			"id": 0,
			"userId": 0,
			"name": "",
			"idCard": "",
			"phone": "",
			"gender": 0,
			"birthday": "",
			"isDefault": 0,
			"createTime": "",
			"updateTime": ""
		}
	]
}
```


## 删除就诊人


**接口地址**:`/user/patient/delete/{id}`


**请求方式**:`DELETE`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|id||path|true|integer(int64)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultBoolean|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||boolean||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": true
}
```


# 商家管理


## 更新商家运营设置


**接口地址**:`/merchant/settings`


**请求方式**:`PUT`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:


**请求示例**:


```javascript
{
  "businessStatus": 0,
  "businessHours": "",
  "deliveryFee": 0,
  "minDeliveryAmount": 0,
  "notice": ""
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|merchantSettingDTO|商家运营设置参数|body|true|MerchantSettingDTO|MerchantSettingDTO|
|&emsp;&emsp;businessStatus|营业状态: 1营业 0休息||false|integer(int32)||
|&emsp;&emsp;businessHours|营业时间 (例如 09:00-22:00)||false|string||
|&emsp;&emsp;deliveryFee|配送费||false|number||
|&emsp;&emsp;minDeliveryAmount|起送金额||false|number||
|&emsp;&emsp;notice|店铺公告||false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|Result|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||object||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {}
}
```


## 商家审核 (管理端)


**接口地址**:`/merchant/audit`


**请求方式**:`PUT`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:


**请求示例**:


```javascript
{
  "id": 0,
  "auditStatus": 0,
  "auditRemark": ""
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|merchantAuditDTO|商家审核参数|body|true|MerchantAuditDTO|MerchantAuditDTO|
|&emsp;&emsp;id|商家ID||true|integer(int64)||
|&emsp;&emsp;auditStatus|审核状态: 1通过 2驳回||true|integer(int32)||
|&emsp;&emsp;auditRemark|审核备注||false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|Result|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||object||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {}
}
```


## 商家入驻-更新信息


**接口地址**:`/merchant/apply`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:


**请求示例**:


```javascript
{
  "shopName": "",
  "shopLogo": "",
  "description": "",
  "address": "",
  "licenseUrl": "",
  "idCardFront": "",
  "idCardBack": "",
  "contactName": "",
  "contactPhone": "",
  "creditCode": ""
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|merchantApplyDTO|商家入驻申请参数|body|true|MerchantApplyDTO|MerchantApplyDTO|
|&emsp;&emsp;shopName|店铺名称||true|string||
|&emsp;&emsp;shopLogo|店铺Logo||false|string||
|&emsp;&emsp;description|店铺简介||false|string||
|&emsp;&emsp;address|店铺地址||true|string||
|&emsp;&emsp;licenseUrl|营业执照图片||true|string||
|&emsp;&emsp;idCardFront|法人身份证正面||false|string||
|&emsp;&emsp;idCardBack|法人身份证背面||false|string||
|&emsp;&emsp;contactName|联系人姓名||false|string||
|&emsp;&emsp;contactPhone|联系电话||false|string||
|&emsp;&emsp;creditCode|统一社会信用代码||false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|Result|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||object||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {}
}
```


## 获取商家详情 (管理端)


**接口地址**:`/merchant/{id}`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|id||path|true|integer(int64)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultMerchant|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||Merchant|Merchant|
|&emsp;&emsp;id||integer(int64)||
|&emsp;&emsp;userId|关联用户ID|integer(int64)||
|&emsp;&emsp;shopName|店铺名称|string||
|&emsp;&emsp;shopLogo|店铺Logo|string||
|&emsp;&emsp;description|店铺简介|string||
|&emsp;&emsp;address|店铺地址|string||
|&emsp;&emsp;licenseUrl|营业执照图片|string||
|&emsp;&emsp;idCardFront|法人身份证正面|string||
|&emsp;&emsp;idCardBack|法人身份证背面|string||
|&emsp;&emsp;contactName|联系人姓名|string||
|&emsp;&emsp;contactPhone|联系电话|string||
|&emsp;&emsp;creditCode|统一社会信用代码|string||
|&emsp;&emsp;businessStatus|营业状态: 1营业 0休息|integer(int32)||
|&emsp;&emsp;businessHours|营业时间|string||
|&emsp;&emsp;deliveryFee|配送费|number||
|&emsp;&emsp;minDeliveryAmount|起送金额|number||
|&emsp;&emsp;notice|店铺公告|string||
|&emsp;&emsp;auditStatus|审核状态: 0待审核 1审核通过 2审核驳回|integer(int32)||
|&emsp;&emsp;auditRemark|审核备注|string||
|&emsp;&emsp;createTime||string(date-time)||
|&emsp;&emsp;updateTime||string(date-time)||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {
		"id": 0,
		"userId": 0,
		"shopName": "",
		"shopLogo": "",
		"description": "",
		"address": "",
		"licenseUrl": "",
		"idCardFront": "",
		"idCardBack": "",
		"contactName": "",
		"contactPhone": "",
		"creditCode": "",
		"businessStatus": 0,
		"businessHours": "",
		"deliveryFee": 0,
		"minDeliveryAmount": 0,
		"notice": "",
		"auditStatus": 0,
		"auditRemark": "",
		"createTime": "",
		"updateTime": ""
	}
}
```


## 获取商家详情 By UserId (管理端)


**接口地址**:`/merchant/user/{userId}`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|userId||path|true|integer(int64)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultMerchant|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||Merchant|Merchant|
|&emsp;&emsp;id||integer(int64)||
|&emsp;&emsp;userId|关联用户ID|integer(int64)||
|&emsp;&emsp;shopName|店铺名称|string||
|&emsp;&emsp;shopLogo|店铺Logo|string||
|&emsp;&emsp;description|店铺简介|string||
|&emsp;&emsp;address|店铺地址|string||
|&emsp;&emsp;licenseUrl|营业执照图片|string||
|&emsp;&emsp;idCardFront|法人身份证正面|string||
|&emsp;&emsp;idCardBack|法人身份证背面|string||
|&emsp;&emsp;contactName|联系人姓名|string||
|&emsp;&emsp;contactPhone|联系电话|string||
|&emsp;&emsp;creditCode|统一社会信用代码|string||
|&emsp;&emsp;businessStatus|营业状态: 1营业 0休息|integer(int32)||
|&emsp;&emsp;businessHours|营业时间|string||
|&emsp;&emsp;deliveryFee|配送费|number||
|&emsp;&emsp;minDeliveryAmount|起送金额|number||
|&emsp;&emsp;notice|店铺公告|string||
|&emsp;&emsp;auditStatus|审核状态: 0待审核 1审核通过 2审核驳回|integer(int32)||
|&emsp;&emsp;auditRemark|审核备注|string||
|&emsp;&emsp;createTime||string(date-time)||
|&emsp;&emsp;updateTime||string(date-time)||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {
		"id": 0,
		"userId": 0,
		"shopName": "",
		"shopLogo": "",
		"description": "",
		"address": "",
		"licenseUrl": "",
		"idCardFront": "",
		"idCardBack": "",
		"contactName": "",
		"contactPhone": "",
		"creditCode": "",
		"businessStatus": 0,
		"businessHours": "",
		"deliveryFee": 0,
		"minDeliveryAmount": 0,
		"notice": "",
		"auditStatus": 0,
		"auditRemark": "",
		"createTime": "",
		"updateTime": ""
	}
}
```


## 获取我的店铺信息


**接口地址**:`/merchant/my-store`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


暂无


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultMerchant|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||Merchant|Merchant|
|&emsp;&emsp;id||integer(int64)||
|&emsp;&emsp;userId|关联用户ID|integer(int64)||
|&emsp;&emsp;shopName|店铺名称|string||
|&emsp;&emsp;shopLogo|店铺Logo|string||
|&emsp;&emsp;description|店铺简介|string||
|&emsp;&emsp;address|店铺地址|string||
|&emsp;&emsp;licenseUrl|营业执照图片|string||
|&emsp;&emsp;idCardFront|法人身份证正面|string||
|&emsp;&emsp;idCardBack|法人身份证背面|string||
|&emsp;&emsp;contactName|联系人姓名|string||
|&emsp;&emsp;contactPhone|联系电话|string||
|&emsp;&emsp;creditCode|统一社会信用代码|string||
|&emsp;&emsp;businessStatus|营业状态: 1营业 0休息|integer(int32)||
|&emsp;&emsp;businessHours|营业时间|string||
|&emsp;&emsp;deliveryFee|配送费|number||
|&emsp;&emsp;minDeliveryAmount|起送金额|number||
|&emsp;&emsp;notice|店铺公告|string||
|&emsp;&emsp;auditStatus|审核状态: 0待审核 1审核通过 2审核驳回|integer(int32)||
|&emsp;&emsp;auditRemark|审核备注|string||
|&emsp;&emsp;createTime||string(date-time)||
|&emsp;&emsp;updateTime||string(date-time)||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {
		"id": 0,
		"userId": 0,
		"shopName": "",
		"shopLogo": "",
		"description": "",
		"address": "",
		"licenseUrl": "",
		"idCardFront": "",
		"idCardBack": "",
		"contactName": "",
		"contactPhone": "",
		"creditCode": "",
		"businessStatus": 0,
		"businessHours": "",
		"deliveryFee": 0,
		"minDeliveryAmount": 0,
		"notice": "",
		"auditStatus": 0,
		"auditRemark": "",
		"createTime": "",
		"updateTime": ""
	}
}
```


## 商家列表 (管理端)


**接口地址**:`/merchant/list`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|query|商家查询参数|query|true|MerchantQueryDTO|MerchantQueryDTO|
|&emsp;&emsp;page|页码||false|integer(int32)||
|&emsp;&emsp;size|每页大小||false|integer(int32)||
|&emsp;&emsp;keyword|关键词(店铺名)||false|string||
|&emsp;&emsp;auditStatus|审核状态: 0待审核 1审核通过 2审核驳回||false|integer(int32)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultIPageMerchant|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||IPageMerchant|IPageMerchant|
|&emsp;&emsp;size||integer(int64)||
|&emsp;&emsp;current||integer(int64)||
|&emsp;&emsp;records|商家信息|array|Merchant|
|&emsp;&emsp;&emsp;&emsp;id||integer||
|&emsp;&emsp;&emsp;&emsp;userId|关联用户ID|integer||
|&emsp;&emsp;&emsp;&emsp;shopName|店铺名称|string||
|&emsp;&emsp;&emsp;&emsp;shopLogo|店铺Logo|string||
|&emsp;&emsp;&emsp;&emsp;description|店铺简介|string||
|&emsp;&emsp;&emsp;&emsp;address|店铺地址|string||
|&emsp;&emsp;&emsp;&emsp;licenseUrl|营业执照图片|string||
|&emsp;&emsp;&emsp;&emsp;idCardFront|法人身份证正面|string||
|&emsp;&emsp;&emsp;&emsp;idCardBack|法人身份证背面|string||
|&emsp;&emsp;&emsp;&emsp;contactName|联系人姓名|string||
|&emsp;&emsp;&emsp;&emsp;contactPhone|联系电话|string||
|&emsp;&emsp;&emsp;&emsp;creditCode|统一社会信用代码|string||
|&emsp;&emsp;&emsp;&emsp;businessStatus|营业状态: 1营业 0休息|integer||
|&emsp;&emsp;&emsp;&emsp;businessHours|营业时间|string||
|&emsp;&emsp;&emsp;&emsp;deliveryFee|配送费|number||
|&emsp;&emsp;&emsp;&emsp;minDeliveryAmount|起送金额|number||
|&emsp;&emsp;&emsp;&emsp;notice|店铺公告|string||
|&emsp;&emsp;&emsp;&emsp;auditStatus|审核状态: 0待审核 1审核通过 2审核驳回|integer||
|&emsp;&emsp;&emsp;&emsp;auditRemark|审核备注|string||
|&emsp;&emsp;&emsp;&emsp;createTime||string||
|&emsp;&emsp;&emsp;&emsp;updateTime||string||
|&emsp;&emsp;pages||integer(int64)||
|&emsp;&emsp;total||integer(int64)||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {
		"size": 0,
		"current": 0,
		"records": [
			{
				"id": 0,
				"userId": 0,
				"shopName": "",
				"shopLogo": "",
				"description": "",
				"address": "",
				"licenseUrl": "",
				"idCardFront": "",
				"idCardBack": "",
				"contactName": "",
				"contactPhone": "",
				"creditCode": "",
				"businessStatus": 0,
				"businessHours": "",
				"deliveryFee": 0,
				"minDeliveryAmount": 0,
				"notice": "",
				"auditStatus": 0,
				"auditRemark": "",
				"createTime": "",
				"updateTime": ""
			}
		],
		"pages": 0,
		"total": 0
	}
}
```


# 分类管理


## 添加分类 (管理员-商家)


**接口地址**:`/category`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:


**请求示例**:


```javascript
{
  "id": 0,
  "name": "",
  "parentId": 0,
  "level": 0,
  "sort": 0,
  "status": 0,
  "createTime": "",
  "updateTime": "",
  "children": [
    {
      "id": 0,
      "name": "",
      "parentId": 0,
      "level": 0,
      "sort": 0,
      "status": 0,
      "createTime": "",
      "updateTime": "",
      "children": [
        {
          "id": 0,
          "name": "",
          "parentId": 0,
          "level": 0,
          "sort": 0,
          "status": 0,
          "createTime": "",
          "updateTime": "",
          "children": [
            {}
          ]
        }
      ]
    }
  ]
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|category|Category|body|true|Category|Category|
|&emsp;&emsp;id|||false|integer(int64)||
|&emsp;&emsp;name|||false|string||
|&emsp;&emsp;parentId|||false|integer(int64)||
|&emsp;&emsp;level|||false|integer(int32)||
|&emsp;&emsp;sort|||false|integer(int32)||
|&emsp;&emsp;status|||false|integer(int32)||
|&emsp;&emsp;createTime|||false|string(date-time)||
|&emsp;&emsp;updateTime|||false|string(date-time)||
|&emsp;&emsp;children|||false|array|Category|


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|Result|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||object||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {}
}
```


## 修改分类 (管理员-商家)


**接口地址**:`/category`


**请求方式**:`PUT`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:


**请求示例**:


```javascript
{
  "id": 0,
  "name": "",
  "parentId": 0,
  "level": 0,
  "sort": 0,
  "status": 0,
  "createTime": "",
  "updateTime": "",
  "children": [
    {
      "id": 0,
      "name": "",
      "parentId": 0,
      "level": 0,
      "sort": 0,
      "status": 0,
      "createTime": "",
      "updateTime": "",
      "children": [
        {
          "id": 0,
          "name": "",
          "parentId": 0,
          "level": 0,
          "sort": 0,
          "status": 0,
          "createTime": "",
          "updateTime": "",
          "children": [
            {}
          ]
        }
      ]
    }
  ]
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|category|Category|body|true|Category|Category|
|&emsp;&emsp;id|||false|integer(int64)||
|&emsp;&emsp;name|||false|string||
|&emsp;&emsp;parentId|||false|integer(int64)||
|&emsp;&emsp;level|||false|integer(int32)||
|&emsp;&emsp;sort|||false|integer(int32)||
|&emsp;&emsp;status|||false|integer(int32)||
|&emsp;&emsp;createTime|||false|string(date-time)||
|&emsp;&emsp;updateTime|||false|string(date-time)||
|&emsp;&emsp;children|||false|array|Category|


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|Result|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||object||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {}
}
```


## 获取分类列表


**接口地址**:`/category/list`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


暂无


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultListCategory|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||array|Category|
|&emsp;&emsp;id||integer(int64)||
|&emsp;&emsp;name||string||
|&emsp;&emsp;parentId||integer(int64)||
|&emsp;&emsp;level||integer(int32)||
|&emsp;&emsp;sort||integer(int32)||
|&emsp;&emsp;status||integer(int32)||
|&emsp;&emsp;createTime||string(date-time)||
|&emsp;&emsp;updateTime||string(date-time)||
|&emsp;&emsp;children||array|Category|


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": [
		{
			"id": 0,
			"name": "",
			"parentId": 0,
			"level": 0,
			"sort": 0,
			"status": 0,
			"createTime": "",
			"updateTime": "",
			"children": [
				{
					"id": 0,
					"name": "",
					"parentId": 0,
					"level": 0,
					"sort": 0,
					"status": 0,
					"createTime": "",
					"updateTime": "",
					"children": [
						{}
					]
				}
			]
		}
	]
}
```


## 删除分类 (管理员-商家)


**接口地址**:`/category/{id}`


**请求方式**:`DELETE`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|id||path|true|integer(int64)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|Result|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||object||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {}
}
```


# 购物车管理


## 更新购物车数量


**接口地址**:`/api/cart/update`


**请求方式**:`PUT`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:


**请求示例**:


```javascript
{
  "id": 0,
  "count": 0
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|cartUpdateDTO|更新购物车请求参数|body|true|CartUpdateDTO|CartUpdateDTO|
|&emsp;&emsp;id|购物车项ID||true|integer(int64)||
|&emsp;&emsp;count|数量||true|integer(int32)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|Result|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||object||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {}
}
```


## 添加购物车


**接口地址**:`/api/cart/add`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:


**请求示例**:


```javascript
{
  "medicineId": 0,
  "count": 0
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|cartAddDTO|添加购物车请求参数|body|true|CartAddDTO|CartAddDTO|
|&emsp;&emsp;medicineId|药品ID||true|integer(int64)||
|&emsp;&emsp;count|数量||true|integer(int32)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|Result|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||object||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {}
}
```


## 获取我的购物车


**接口地址**:`/api/cart/list`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


暂无


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultListCartItemVO|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||array|CartItemVO|
|&emsp;&emsp;id|购物车项ID|integer(int64)||
|&emsp;&emsp;medicineId|药品ID|integer(int64)||
|&emsp;&emsp;medicineName|药品名称|string||
|&emsp;&emsp;medicineImage|药品图片|string||
|&emsp;&emsp;price|单价|number||
|&emsp;&emsp;count|数量|integer(int32)||
|&emsp;&emsp;stock|库存|integer(int32)||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": [
		{
			"id": 0,
			"medicineId": 0,
			"medicineName": "",
			"medicineImage": "",
			"price": 0,
			"count": 0,
			"stock": 0
		}
	]
}
```


## 删除购物车项


**接口地址**:`/api/cart/delete`


**请求方式**:`DELETE`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:


**请求示例**:


```javascript
[]
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|integers|integer|body|true|array||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|Result|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||object||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {}
}
```


# 收货地址管理


## 修改地址


**接口地址**:`/api/address/update`


**请求方式**:`PUT`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:


**请求示例**:


```javascript
{
  "receiverName": "",
  "receiverPhone": "",
  "province": "",
  "city": "",
  "region": "",
  "detailAddress": "",
  "isDefault": 0,
  "id": 0
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|addressUpdateDTO|更新地址请求参数|body|true|AddressUpdateDTO|AddressUpdateDTO|
|&emsp;&emsp;receiverName|收货人姓名||true|string||
|&emsp;&emsp;receiverPhone|收货人手机号||true|string||
|&emsp;&emsp;province|省份||true|string||
|&emsp;&emsp;city|城市||true|string||
|&emsp;&emsp;region|区/县||true|string||
|&emsp;&emsp;detailAddress|详细地址||true|string||
|&emsp;&emsp;isDefault|是否默认: 1是 0否||false|integer(int32)||
|&emsp;&emsp;id|地址ID||true|integer(int64)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|Result|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||object||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {}
}
```


## 设为默认地址


**接口地址**:`/api/address/default/{id}`


**请求方式**:`PUT`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|id||path|true|integer(int64)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|Result|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||object||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {}
}
```


## 添加地址


**接口地址**:`/api/address/add`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:


**请求示例**:


```javascript
{
  "receiverName": "",
  "receiverPhone": "",
  "province": "",
  "city": "",
  "region": "",
  "detailAddress": "",
  "isDefault": 0
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|addressAddDTO|添加地址请求参数|body|true|AddressAddDTO|AddressAddDTO|
|&emsp;&emsp;receiverName|收货人姓名||true|string||
|&emsp;&emsp;receiverPhone|收货人手机号||true|string||
|&emsp;&emsp;province|省份||true|string||
|&emsp;&emsp;city|城市||true|string||
|&emsp;&emsp;region|区/县||true|string||
|&emsp;&emsp;detailAddress|详细地址||true|string||
|&emsp;&emsp;isDefault|是否默认: 1是 0否||false|integer(int32)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|Result|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||object||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {}
}
```


## 获取我的地址列表


**接口地址**:`/api/address/list`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


暂无


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultListUserAddress|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||array|UserAddress|
|&emsp;&emsp;id||integer(int64)||
|&emsp;&emsp;userId||integer(int64)||
|&emsp;&emsp;receiverName||string||
|&emsp;&emsp;receiverPhone||string||
|&emsp;&emsp;province||string||
|&emsp;&emsp;city||string||
|&emsp;&emsp;region||string||
|&emsp;&emsp;detailAddress||string||
|&emsp;&emsp;isDefault||integer(int32)||
|&emsp;&emsp;createTime||string(date-time)||
|&emsp;&emsp;updateTime||string(date-time)||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": [
		{
			"id": 0,
			"userId": 0,
			"receiverName": "",
			"receiverPhone": "",
			"province": "",
			"city": "",
			"region": "",
			"detailAddress": "",
			"isDefault": 0,
			"createTime": "",
			"updateTime": ""
		}
	]
}
```


## 删除地址


**接口地址**:`/api/address/delete/{id}`


**请求方式**:`DELETE`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|id||path|true|integer(int64)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|Result|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||object||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {}
}
```


# 轮播图管理


## 修改轮播图


**接口地址**:`/admin/banner/{id}`


**请求方式**:`PUT`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:


**请求示例**:


```javascript
{
  "title": "",
  "imageUrl": "",
  "linkUrl": "",
  "sort": 0,
  "status": 0
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|id||path|true|integer(int64)||
|bannerDTO|轮播图 DTO|body|true|BannerDTO|BannerDTO|
|&emsp;&emsp;title|标题||true|string||
|&emsp;&emsp;imageUrl|图片地址||true|string||
|&emsp;&emsp;linkUrl|跳转链接||false|string||
|&emsp;&emsp;sort|排序||false|integer(int32)||
|&emsp;&emsp;status|状态: 1启用 0禁用||false|integer(int32)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|Result|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||object||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {}
}
```


## 删除轮播图


**接口地址**:`/admin/banner/{id}`


**请求方式**:`DELETE`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|id||path|true|integer(int64)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|Result|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||object||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {}
}
```


## 添加轮播图


**接口地址**:`/admin/banner`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:


**请求示例**:


```javascript
{
  "title": "",
  "imageUrl": "",
  "linkUrl": "",
  "sort": 0,
  "status": 0
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|bannerDTO|轮播图 DTO|body|true|BannerDTO|BannerDTO|
|&emsp;&emsp;title|标题||true|string||
|&emsp;&emsp;imageUrl|图片地址||true|string||
|&emsp;&emsp;linkUrl|跳转链接||false|string||
|&emsp;&emsp;sort|排序||false|integer(int32)||
|&emsp;&emsp;status|状态: 1启用 0禁用||false|integer(int32)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|Result|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||object||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {}
}
```


## 分页查询轮播图


**接口地址**:`/admin/banner/list`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|page||query|false|integer(int32)||
|size||query|false|integer(int32)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultIPageBanner|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||IPageBanner|IPageBanner|
|&emsp;&emsp;size||integer(int64)||
|&emsp;&emsp;current||integer(int64)||
|&emsp;&emsp;records|轮播图列表|array|Banner|
|&emsp;&emsp;&emsp;&emsp;id||integer||
|&emsp;&emsp;&emsp;&emsp;title||string||
|&emsp;&emsp;&emsp;&emsp;imageUrl||string||
|&emsp;&emsp;&emsp;&emsp;linkUrl||string||
|&emsp;&emsp;&emsp;&emsp;sort||integer||
|&emsp;&emsp;&emsp;&emsp;status||integer||
|&emsp;&emsp;&emsp;&emsp;createTime||string||
|&emsp;&emsp;&emsp;&emsp;updateTime||string||
|&emsp;&emsp;pages||integer(int64)||
|&emsp;&emsp;total||integer(int64)||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {
		"size": 0,
		"current": 0,
		"records": [
			{
				"id": 0,
				"title": "",
				"imageUrl": "",
				"linkUrl": "",
				"sort": 0,
				"status": 0,
				"createTime": "",
				"updateTime": ""
			}
		],
		"pages": 0,
		"total": 0
	}
}
```


# 系统配置


## 获取所有配置


**接口地址**:`/sys/config`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


暂无


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultMapStringString|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||object||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {}
}
```


## 更新配置


**接口地址**:`/sys/config`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


暂无


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|Result|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||object||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {}
}
```


# 用户优惠券


## 领取优惠券


**接口地址**:`/marketing/user-coupon/receive/{couponId}`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|couponId||path|true|integer(int64)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|Result|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||object||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {}
}
```


## 我的优惠券


**接口地址**:`/marketing/user-coupon/my`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|status||query|false|integer(int32)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultListUserCouponDTO|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||array|UserCouponDTO|
|&emsp;&emsp;id|记录ID|integer(int64)||
|&emsp;&emsp;couponId|优惠券ID|integer(int64)||
|&emsp;&emsp;name|优惠券名称|string||
|&emsp;&emsp;amount|抵扣金额|number||
|&emsp;&emsp;minPoint|使用门槛|number||
|&emsp;&emsp;startTime|开始时间|string(date-time)||
|&emsp;&emsp;endTime|结束时间|string(date-time)||
|&emsp;&emsp;useStatus|使用状态 (0:未使用 1:已使用 2:已过期)|integer(int32)||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": [
		{
			"id": 0,
			"couponId": 0,
			"name": "",
			"amount": 0,
			"minPoint": 0,
			"startTime": "",
			"endTime": "",
			"useStatus": 0
		}
	]
}
```


# 优惠券管理


## 创建优惠券


**接口地址**:`/marketing/coupon/create`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:


**请求示例**:


```javascript
{
  "name": "",
  "type": 0,
  "minPoint": 0,
  "amount": 0,
  "perLimit": 0,
  "totalCount": 0,
  "startTime": "",
  "endTime": ""
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|couponCreateDTO|优惠券创建参数|body|true|CouponCreateDTO|CouponCreateDTO|
|&emsp;&emsp;name|优惠券名称||false|string||
|&emsp;&emsp;type|优惠券类型 (0:全场通用 1:指定分类 2:指定商品)||false|integer(int32)||
|&emsp;&emsp;minPoint|使用门槛 (0:无门槛)||false|number||
|&emsp;&emsp;amount|抵扣金额||false|number||
|&emsp;&emsp;perLimit|每人限领张数||false|integer(int32)||
|&emsp;&emsp;totalCount|发行数量||false|integer(int32)||
|&emsp;&emsp;startTime|生效时间||false|string(date-time)||
|&emsp;&emsp;endTime|失效时间||false|string(date-time)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|Result|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||object||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {}
}
```


## 获取可领取列表


**接口地址**:`/marketing/coupon/list`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


暂无


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultListCoupon|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||array|Coupon|
|&emsp;&emsp;id||integer(int64)||
|&emsp;&emsp;name||string||
|&emsp;&emsp;type||integer(int32)||
|&emsp;&emsp;minPoint||number||
|&emsp;&emsp;amount||number||
|&emsp;&emsp;perLimit||integer(int32)||
|&emsp;&emsp;useCount||integer(int32)||
|&emsp;&emsp;receiveCount||integer(int32)||
|&emsp;&emsp;totalCount||integer(int32)||
|&emsp;&emsp;status||integer(int32)||
|&emsp;&emsp;startTime||string(date-time)||
|&emsp;&emsp;endTime||string(date-time)||
|&emsp;&emsp;createTime||string(date-time)||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": [
		{
			"id": 0,
			"name": "",
			"type": 0,
			"minPoint": 0,
			"amount": 0,
			"perLimit": 0,
			"useCount": 0,
			"receiveCount": 0,
			"totalCount": 0,
			"status": 0,
			"startTime": "",
			"endTime": "",
			"createTime": ""
		}
	]
}
```


# 文件管理


## 上传文件


**接口地址**:`/file/upload`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|file||query|true|file||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultString|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||string||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": ""
}
```


# 配送管理 (骑手端)


## 确认送达


**接口地址**:`/delivery/{id}/complete`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|id||path|true|integer(int64)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|Result|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||object||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {}
}
```


## 骑手接单


**接口地址**:`/delivery/{id}/accept`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|id||path|true|integer(int64)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|Result|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||object||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {}
}
```


## 查询可接单列表


**接口地址**:`/delivery/pending/list`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|page||query|false|integer(int32)||
|size||query|false|integer(int32)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultIPageDelivery|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||IPageDelivery|IPageDelivery|
|&emsp;&emsp;size||integer(int64)||
|&emsp;&emsp;current||integer(int64)||
|&emsp;&emsp;records||array|Delivery|
|&emsp;&emsp;&emsp;&emsp;id||integer||
|&emsp;&emsp;&emsp;&emsp;orderId||integer||
|&emsp;&emsp;&emsp;&emsp;courierId||integer||
|&emsp;&emsp;&emsp;&emsp;courierName||string||
|&emsp;&emsp;&emsp;&emsp;courierPhone||string||
|&emsp;&emsp;&emsp;&emsp;receiverName||string||
|&emsp;&emsp;&emsp;&emsp;receiverPhone||string||
|&emsp;&emsp;&emsp;&emsp;receiverAddress||string||
|&emsp;&emsp;&emsp;&emsp;status||integer||
|&emsp;&emsp;&emsp;&emsp;createTime||string||
|&emsp;&emsp;&emsp;&emsp;updateTime||string||
|&emsp;&emsp;pages||integer(int64)||
|&emsp;&emsp;total||integer(int64)||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {
		"size": 0,
		"current": 0,
		"records": [
			{
				"id": 0,
				"orderId": 0,
				"courierId": 0,
				"courierName": "",
				"courierPhone": "",
				"receiverName": "",
				"receiverPhone": "",
				"receiverAddress": "",
				"status": 0,
				"createTime": "",
				"updateTime": ""
			}
		],
		"pages": 0,
		"total": 0
	}
}
```


## 我的配送单


**接口地址**:`/delivery/my/list`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|status||query|false|integer(int32)||
|page||query|false|integer(int32)||
|size||query|false|integer(int32)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultIPageDelivery|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||IPageDelivery|IPageDelivery|
|&emsp;&emsp;size||integer(int64)||
|&emsp;&emsp;current||integer(int64)||
|&emsp;&emsp;records||array|Delivery|
|&emsp;&emsp;&emsp;&emsp;id||integer||
|&emsp;&emsp;&emsp;&emsp;orderId||integer||
|&emsp;&emsp;&emsp;&emsp;courierId||integer||
|&emsp;&emsp;&emsp;&emsp;courierName||string||
|&emsp;&emsp;&emsp;&emsp;courierPhone||string||
|&emsp;&emsp;&emsp;&emsp;receiverName||string||
|&emsp;&emsp;&emsp;&emsp;receiverPhone||string||
|&emsp;&emsp;&emsp;&emsp;receiverAddress||string||
|&emsp;&emsp;&emsp;&emsp;status||integer||
|&emsp;&emsp;&emsp;&emsp;createTime||string||
|&emsp;&emsp;&emsp;&emsp;updateTime||string||
|&emsp;&emsp;pages||integer(int64)||
|&emsp;&emsp;total||integer(int64)||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {
		"size": 0,
		"current": 0,
		"records": [
			{
				"id": 0,
				"orderId": 0,
				"courierId": 0,
				"courierName": "",
				"courierPhone": "",
				"receiverName": "",
				"receiverPhone": "",
				"receiverAddress": "",
				"status": 0,
				"createTime": "",
				"updateTime": ""
			}
		],
		"pages": 0,
		"total": 0
	}
}
```


# 订单管理


## 商家发货


**接口地址**:`/api/orders/{id}/ship`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|id||path|true|integer(int64)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|Result|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||object||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {}
}
```


## 确认收货


**接口地址**:`/api/orders/{id}/receive`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|id||path|true|integer(int64)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|Result|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||object||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {}
}
```


## 支付订单 (模拟)


**接口地址**:`/api/orders/{id}/pay`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|id||path|true|integer(int64)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|Result|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||object||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {}
}
```


## 创建订单


**接口地址**:`/api/orders/create`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:


**请求示例**:


```javascript
{
  "medicineId": 1,
  "quantity": 2,
  "receiverName": "张三",
  "receiverPhone": "13800138000",
  "receiverAddress": "北京市朝阳区",
  "userCouponId": 0,
  "patientId": 0,
  "prescriptionImage": ""
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|orderCreateDTO|创建订单请求参数|body|true|OrderCreateDTO|OrderCreateDTO|
|&emsp;&emsp;medicineId|药品ID||true|integer(int64)||
|&emsp;&emsp;quantity|购买数量||true|integer(int32)||
|&emsp;&emsp;receiverName|收货人姓名||true|string||
|&emsp;&emsp;receiverPhone|收货人电话||true|string||
|&emsp;&emsp;receiverAddress|收货地址||true|string||
|&emsp;&emsp;userCouponId|优惠券ID (UserCoupon ID)||false|integer(int64)||
|&emsp;&emsp;patientId|就诊人ID (处方药必填)||false|integer(int64)||
|&emsp;&emsp;prescriptionImage|处方图片URL (处方药必填)||false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|Result|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||object||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {}
}
```


## 从购物车创建订单


**接口地址**:`/api/orders/createFromCart`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:


**请求示例**:


```javascript
{
  "cartItemIds": [],
  "addressId": 0,
  "userCouponId": 0,
  "patientId": 0,
  "prescriptionImage": ""
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|orderCreateFromCartDTO|购物车下单请求参数|body|true|OrderCreateFromCartDTO|OrderCreateFromCartDTO|
|&emsp;&emsp;cartItemIds|购物车项ID列表||true|array|integer(int64)|
|&emsp;&emsp;addressId|收货地址ID||true|integer(int64)||
|&emsp;&emsp;userCouponId|优惠券ID (UserCoupon ID)||false|integer(int64)||
|&emsp;&emsp;patientId|就诊人ID (处方药必填)||false|integer(int64)||
|&emsp;&emsp;prescriptionImage|处方图片URL (处方药必填)||false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|Result|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||object||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {}
}
```


## 审核订单 (药师)


**接口地址**:`/api/orders/audit`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:


**请求示例**:


```javascript
{
  "orderId": 0,
  "pass": true,
  "reason": ""
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|orderAuditDTO|订单审核参数|body|true|OrderAuditDTO|OrderAuditDTO|
|&emsp;&emsp;orderId|订单ID||true|integer(int64)||
|&emsp;&emsp;pass|是否通过||true|boolean||
|&emsp;&emsp;reason|审核意见||false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|Result|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||object||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {}
}
```


## 订单详情


**接口地址**:`/api/orders/{id}`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|id||path|true|integer(int64)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultOrder|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||Order|Order|
|&emsp;&emsp;id||integer(int64)||
|&emsp;&emsp;userId||integer(int64)||
|&emsp;&emsp;sellerId||integer(int64)||
|&emsp;&emsp;orderNo||string||
|&emsp;&emsp;medicineId||integer(int64)||
|&emsp;&emsp;medicineName||string||
|&emsp;&emsp;medicineImage||string||
|&emsp;&emsp;quantity||integer(int32)||
|&emsp;&emsp;price||number||
|&emsp;&emsp;totalAmount||number||
|&emsp;&emsp;couponAmount||number||
|&emsp;&emsp;payAmount||number||
|&emsp;&emsp;couponHistoryId||integer(int64)||
|&emsp;&emsp;status||integer(int32)||
|&emsp;&emsp;receiverName||string||
|&emsp;&emsp;receiverPhone||string||
|&emsp;&emsp;receiverAddress||string||
|&emsp;&emsp;createTime||string(date-time)||
|&emsp;&emsp;updateTime||string(date-time)||
|&emsp;&emsp;payTime||string(date-time)||
|&emsp;&emsp;deliveryTime||string(date-time)||
|&emsp;&emsp;finishTime||string(date-time)||
|&emsp;&emsp;commentStatus||integer(int32)||
|&emsp;&emsp;patientId||integer(int64)||
|&emsp;&emsp;prescriptionImage||string||
|&emsp;&emsp;auditStatus||integer(int32)||
|&emsp;&emsp;auditReason||string||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {
		"id": 0,
		"userId": 0,
		"sellerId": 0,
		"orderNo": "",
		"medicineId": 0,
		"medicineName": "",
		"medicineImage": "",
		"quantity": 0,
		"price": 0,
		"totalAmount": 0,
		"couponAmount": 0,
		"payAmount": 0,
		"couponHistoryId": 0,
		"status": 0,
		"receiverName": "",
		"receiverPhone": "",
		"receiverAddress": "",
		"createTime": "",
		"updateTime": "",
		"payTime": "",
		"deliveryTime": "",
		"finishTime": "",
		"commentStatus": 0,
		"patientId": 0,
		"prescriptionImage": "",
		"auditStatus": 0,
		"auditReason": ""
	}
}
```


## 商家订单列表


**接口地址**:`/api/orders/seller/list`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|queryDTO|订单查询参数|query|true|OrderQueryDTO|OrderQueryDTO|
|&emsp;&emsp;status|订单状态: 0待支付 1待发货 2待收货 3已完成 4已取消 7待审核||false|integer(int32)||
|&emsp;&emsp;auditStatus|审核状态: 0-无需审核 1-待审核 2-审核通过 3-审核拒绝||false|integer(int32)||
|&emsp;&emsp;page|页码||false|integer(int32)||
|&emsp;&emsp;size|每页大小||false|integer(int32)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultIPageOrder|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||IPageOrder|IPageOrder|
|&emsp;&emsp;size||integer(int64)||
|&emsp;&emsp;current||integer(int64)||
|&emsp;&emsp;records||array|Order|
|&emsp;&emsp;&emsp;&emsp;id||integer||
|&emsp;&emsp;&emsp;&emsp;userId||integer||
|&emsp;&emsp;&emsp;&emsp;sellerId||integer||
|&emsp;&emsp;&emsp;&emsp;orderNo||string||
|&emsp;&emsp;&emsp;&emsp;medicineId||integer||
|&emsp;&emsp;&emsp;&emsp;medicineName||string||
|&emsp;&emsp;&emsp;&emsp;medicineImage||string||
|&emsp;&emsp;&emsp;&emsp;quantity||integer||
|&emsp;&emsp;&emsp;&emsp;price||number||
|&emsp;&emsp;&emsp;&emsp;totalAmount||number||
|&emsp;&emsp;&emsp;&emsp;couponAmount||number||
|&emsp;&emsp;&emsp;&emsp;payAmount||number||
|&emsp;&emsp;&emsp;&emsp;couponHistoryId||integer||
|&emsp;&emsp;&emsp;&emsp;status||integer||
|&emsp;&emsp;&emsp;&emsp;receiverName||string||
|&emsp;&emsp;&emsp;&emsp;receiverPhone||string||
|&emsp;&emsp;&emsp;&emsp;receiverAddress||string||
|&emsp;&emsp;&emsp;&emsp;createTime||string||
|&emsp;&emsp;&emsp;&emsp;updateTime||string||
|&emsp;&emsp;&emsp;&emsp;payTime||string||
|&emsp;&emsp;&emsp;&emsp;deliveryTime||string||
|&emsp;&emsp;&emsp;&emsp;finishTime||string||
|&emsp;&emsp;&emsp;&emsp;commentStatus||integer||
|&emsp;&emsp;&emsp;&emsp;patientId||integer||
|&emsp;&emsp;&emsp;&emsp;prescriptionImage||string||
|&emsp;&emsp;&emsp;&emsp;auditStatus||integer||
|&emsp;&emsp;&emsp;&emsp;auditReason||string||
|&emsp;&emsp;pages||integer(int64)||
|&emsp;&emsp;total||integer(int64)||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {
		"size": 0,
		"current": 0,
		"records": [
			{
				"id": 0,
				"userId": 0,
				"sellerId": 0,
				"orderNo": "",
				"medicineId": 0,
				"medicineName": "",
				"medicineImage": "",
				"quantity": 0,
				"price": 0,
				"totalAmount": 0,
				"couponAmount": 0,
				"payAmount": 0,
				"couponHistoryId": 0,
				"status": 0,
				"receiverName": "",
				"receiverPhone": "",
				"receiverAddress": "",
				"createTime": "",
				"updateTime": "",
				"payTime": "",
				"deliveryTime": "",
				"finishTime": "",
				"commentStatus": 0,
				"patientId": 0,
				"prescriptionImage": "",
				"auditStatus": 0,
				"auditReason": ""
			}
		],
		"pages": 0,
		"total": 0
	}
}
```


## 我的订单列表 (用户)


**接口地址**:`/api/orders/list`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|queryDTO|订单查询参数|query|true|OrderQueryDTO|OrderQueryDTO|
|&emsp;&emsp;status|订单状态: 0待支付 1待发货 2待收货 3已完成 4已取消 7待审核||false|integer(int32)||
|&emsp;&emsp;auditStatus|审核状态: 0-无需审核 1-待审核 2-审核通过 3-审核拒绝||false|integer(int32)||
|&emsp;&emsp;page|页码||false|integer(int32)||
|&emsp;&emsp;size|每页大小||false|integer(int32)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultIPageOrder|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||IPageOrder|IPageOrder|
|&emsp;&emsp;size||integer(int64)||
|&emsp;&emsp;current||integer(int64)||
|&emsp;&emsp;records||array|Order|
|&emsp;&emsp;&emsp;&emsp;id||integer||
|&emsp;&emsp;&emsp;&emsp;userId||integer||
|&emsp;&emsp;&emsp;&emsp;sellerId||integer||
|&emsp;&emsp;&emsp;&emsp;orderNo||string||
|&emsp;&emsp;&emsp;&emsp;medicineId||integer||
|&emsp;&emsp;&emsp;&emsp;medicineName||string||
|&emsp;&emsp;&emsp;&emsp;medicineImage||string||
|&emsp;&emsp;&emsp;&emsp;quantity||integer||
|&emsp;&emsp;&emsp;&emsp;price||number||
|&emsp;&emsp;&emsp;&emsp;totalAmount||number||
|&emsp;&emsp;&emsp;&emsp;couponAmount||number||
|&emsp;&emsp;&emsp;&emsp;payAmount||number||
|&emsp;&emsp;&emsp;&emsp;couponHistoryId||integer||
|&emsp;&emsp;&emsp;&emsp;status||integer||
|&emsp;&emsp;&emsp;&emsp;receiverName||string||
|&emsp;&emsp;&emsp;&emsp;receiverPhone||string||
|&emsp;&emsp;&emsp;&emsp;receiverAddress||string||
|&emsp;&emsp;&emsp;&emsp;createTime||string||
|&emsp;&emsp;&emsp;&emsp;updateTime||string||
|&emsp;&emsp;&emsp;&emsp;payTime||string||
|&emsp;&emsp;&emsp;&emsp;deliveryTime||string||
|&emsp;&emsp;&emsp;&emsp;finishTime||string||
|&emsp;&emsp;&emsp;&emsp;commentStatus||integer||
|&emsp;&emsp;&emsp;&emsp;patientId||integer||
|&emsp;&emsp;&emsp;&emsp;prescriptionImage||string||
|&emsp;&emsp;&emsp;&emsp;auditStatus||integer||
|&emsp;&emsp;&emsp;&emsp;auditReason||string||
|&emsp;&emsp;pages||integer(int64)||
|&emsp;&emsp;total||integer(int64)||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {
		"size": 0,
		"current": 0,
		"records": [
			{
				"id": 0,
				"userId": 0,
				"sellerId": 0,
				"orderNo": "",
				"medicineId": 0,
				"medicineName": "",
				"medicineImage": "",
				"quantity": 0,
				"price": 0,
				"totalAmount": 0,
				"couponAmount": 0,
				"payAmount": 0,
				"couponHistoryId": 0,
				"status": 0,
				"receiverName": "",
				"receiverPhone": "",
				"receiverAddress": "",
				"createTime": "",
				"updateTime": "",
				"payTime": "",
				"deliveryTime": "",
				"finishTime": "",
				"commentStatus": 0,
				"patientId": 0,
				"prescriptionImage": "",
				"auditStatus": 0,
				"auditReason": ""
			}
		],
		"pages": 0,
		"total": 0
	}
}
```


## 待审核订单列表 (药师)


**接口地址**:`/api/orders/audit/list`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|queryDTO|订单查询参数|query|true|OrderQueryDTO|OrderQueryDTO|
|&emsp;&emsp;status|订单状态: 0待支付 1待发货 2待收货 3已完成 4已取消 7待审核||false|integer(int32)||
|&emsp;&emsp;auditStatus|审核状态: 0-无需审核 1-待审核 2-审核通过 3-审核拒绝||false|integer(int32)||
|&emsp;&emsp;page|页码||false|integer(int32)||
|&emsp;&emsp;size|每页大小||false|integer(int32)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultIPageOrder|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||IPageOrder|IPageOrder|
|&emsp;&emsp;size||integer(int64)||
|&emsp;&emsp;current||integer(int64)||
|&emsp;&emsp;records||array|Order|
|&emsp;&emsp;&emsp;&emsp;id||integer||
|&emsp;&emsp;&emsp;&emsp;userId||integer||
|&emsp;&emsp;&emsp;&emsp;sellerId||integer||
|&emsp;&emsp;&emsp;&emsp;orderNo||string||
|&emsp;&emsp;&emsp;&emsp;medicineId||integer||
|&emsp;&emsp;&emsp;&emsp;medicineName||string||
|&emsp;&emsp;&emsp;&emsp;medicineImage||string||
|&emsp;&emsp;&emsp;&emsp;quantity||integer||
|&emsp;&emsp;&emsp;&emsp;price||number||
|&emsp;&emsp;&emsp;&emsp;totalAmount||number||
|&emsp;&emsp;&emsp;&emsp;couponAmount||number||
|&emsp;&emsp;&emsp;&emsp;payAmount||number||
|&emsp;&emsp;&emsp;&emsp;couponHistoryId||integer||
|&emsp;&emsp;&emsp;&emsp;status||integer||
|&emsp;&emsp;&emsp;&emsp;receiverName||string||
|&emsp;&emsp;&emsp;&emsp;receiverPhone||string||
|&emsp;&emsp;&emsp;&emsp;receiverAddress||string||
|&emsp;&emsp;&emsp;&emsp;createTime||string||
|&emsp;&emsp;&emsp;&emsp;updateTime||string||
|&emsp;&emsp;&emsp;&emsp;payTime||string||
|&emsp;&emsp;&emsp;&emsp;deliveryTime||string||
|&emsp;&emsp;&emsp;&emsp;finishTime||string||
|&emsp;&emsp;&emsp;&emsp;commentStatus||integer||
|&emsp;&emsp;&emsp;&emsp;patientId||integer||
|&emsp;&emsp;&emsp;&emsp;prescriptionImage||string||
|&emsp;&emsp;&emsp;&emsp;auditStatus||integer||
|&emsp;&emsp;&emsp;&emsp;auditReason||string||
|&emsp;&emsp;pages||integer(int64)||
|&emsp;&emsp;total||integer(int64)||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {
		"size": 0,
		"current": 0,
		"records": [
			{
				"id": 0,
				"userId": 0,
				"sellerId": 0,
				"orderNo": "",
				"medicineId": 0,
				"medicineName": "",
				"medicineImage": "",
				"quantity": 0,
				"price": 0,
				"totalAmount": 0,
				"couponAmount": 0,
				"payAmount": 0,
				"couponHistoryId": 0,
				"status": 0,
				"receiverName": "",
				"receiverPhone": "",
				"receiverAddress": "",
				"createTime": "",
				"updateTime": "",
				"payTime": "",
				"deliveryTime": "",
				"finishTime": "",
				"commentStatus": 0,
				"patientId": 0,
				"prescriptionImage": "",
				"auditStatus": 0,
				"auditReason": ""
			}
		],
		"pages": 0,
		"total": 0
	}
}
```


# 药品收藏管理


## 收藏-取消收藏


**接口地址**:`/api/favorite/toggle`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:


**请求示例**:


```javascript
{
  "medicineId": 0
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|favoriteAddDTO|收藏药品请求参数|body|true|FavoriteAddDTO|FavoriteAddDTO|
|&emsp;&emsp;medicineId|药品ID||true|integer(int64)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|Result|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||object||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {}
}
```


## 获取我的收藏列表


**接口地址**:`/api/favorite/list`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|page||query|false|integer(int32)||
|size||query|false|integer(int32)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultIPageObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||IPageObject|IPageObject|
|&emsp;&emsp;size||integer(int64)||
|&emsp;&emsp;current||integer(int64)||
|&emsp;&emsp;records||array|object|
|&emsp;&emsp;pages||integer(int64)||
|&emsp;&emsp;total||integer(int64)||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {
		"size": 0,
		"current": 0,
		"records": [],
		"pages": 0,
		"total": 0
	}
}
```


## 查询是否已收藏


**接口地址**:`/api/favorite/check/{medicineId}`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|medicineId||path|true|integer(int64)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultBoolean|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||boolean||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": true
}
```


# 订单评价管理


## 发表评价


**接口地址**:`/api/comments/add`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:


**请求示例**:


```javascript
{
  "orderId": 0,
  "rating": 0,
  "content": "",
  "images": ""
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|orderCommentCreateDTO|创建订单评价请求参数|body|true|OrderCommentCreateDTO|OrderCommentCreateDTO|
|&emsp;&emsp;orderId|订单ID||true|integer(int64)||
|&emsp;&emsp;rating|评分 (1-5)||true|integer(int32)||
|&emsp;&emsp;content|评价内容||true|string||
|&emsp;&emsp;images|评价图片 (JSON数组字符串)||false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|Result|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||object||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {}
}
```


## 获取我的评价列表


**接口地址**:`/api/comments/my`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|page||query|false|integer(int32)||
|size||query|false|integer(int32)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultIPageOrderComment|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||IPageOrderComment|IPageOrderComment|
|&emsp;&emsp;size||integer(int64)||
|&emsp;&emsp;current||integer(int64)||
|&emsp;&emsp;records||array|OrderComment|
|&emsp;&emsp;&emsp;&emsp;id||integer||
|&emsp;&emsp;&emsp;&emsp;orderId||integer||
|&emsp;&emsp;&emsp;&emsp;userId||integer||
|&emsp;&emsp;&emsp;&emsp;userName||string||
|&emsp;&emsp;&emsp;&emsp;userAvatar||string||
|&emsp;&emsp;&emsp;&emsp;medicineId||integer||
|&emsp;&emsp;&emsp;&emsp;rating||integer||
|&emsp;&emsp;&emsp;&emsp;content||string||
|&emsp;&emsp;&emsp;&emsp;images||string||
|&emsp;&emsp;&emsp;&emsp;reply||string||
|&emsp;&emsp;&emsp;&emsp;replyTime||string||
|&emsp;&emsp;&emsp;&emsp;status||integer||
|&emsp;&emsp;&emsp;&emsp;createTime||string||
|&emsp;&emsp;&emsp;&emsp;updateTime||string||
|&emsp;&emsp;pages||integer(int64)||
|&emsp;&emsp;total||integer(int64)||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {
		"size": 0,
		"current": 0,
		"records": [
			{
				"id": 0,
				"orderId": 0,
				"userId": 0,
				"userName": "",
				"userAvatar": "",
				"medicineId": 0,
				"rating": 0,
				"content": "",
				"images": "",
				"reply": "",
				"replyTime": "",
				"status": 0,
				"createTime": "",
				"updateTime": ""
			}
		],
		"pages": 0,
		"total": 0
	}
}
```


## 获取药品评价列表


**接口地址**:`/api/comments/medicine/{medicineId}`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|medicineId||path|true|integer(int64)||
|page||query|false|integer(int32)||
|size||query|false|integer(int32)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultIPageOrderComment|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||IPageOrderComment|IPageOrderComment|
|&emsp;&emsp;size||integer(int64)||
|&emsp;&emsp;current||integer(int64)||
|&emsp;&emsp;records||array|OrderComment|
|&emsp;&emsp;&emsp;&emsp;id||integer||
|&emsp;&emsp;&emsp;&emsp;orderId||integer||
|&emsp;&emsp;&emsp;&emsp;userId||integer||
|&emsp;&emsp;&emsp;&emsp;userName||string||
|&emsp;&emsp;&emsp;&emsp;userAvatar||string||
|&emsp;&emsp;&emsp;&emsp;medicineId||integer||
|&emsp;&emsp;&emsp;&emsp;rating||integer||
|&emsp;&emsp;&emsp;&emsp;content||string||
|&emsp;&emsp;&emsp;&emsp;images||string||
|&emsp;&emsp;&emsp;&emsp;reply||string||
|&emsp;&emsp;&emsp;&emsp;replyTime||string||
|&emsp;&emsp;&emsp;&emsp;status||integer||
|&emsp;&emsp;&emsp;&emsp;createTime||string||
|&emsp;&emsp;&emsp;&emsp;updateTime||string||
|&emsp;&emsp;pages||integer(int64)||
|&emsp;&emsp;total||integer(int64)||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {
		"size": 0,
		"current": 0,
		"records": [
			{
				"id": 0,
				"orderId": 0,
				"userId": 0,
				"userName": "",
				"userAvatar": "",
				"medicineId": 0,
				"rating": 0,
				"content": "",
				"images": "",
				"reply": "",
				"replyTime": "",
				"status": 0,
				"createTime": "",
				"updateTime": ""
			}
		],
		"pages": 0,
		"total": 0
	}
}
```


# AI智能导诊


## 智能咨询


**接口地址**:`/ai/chat`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:


**请求示例**:


```javascript
{
  "message": ""
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|chatRequestDTO|AI聊天请求|body|true|ChatRequestDTO|ChatRequestDTO|
|&emsp;&emsp;message|用户输入||true|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultString|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||string||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": ""
}
```


# 售后管理


## 审核退款 (管理员-商家)


**接口地址**:`/aftersales/audit`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:


**请求示例**:


```javascript
{
  "id": 0,
  "pass": true,
  "auditReason": ""
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|refundAuditDTO|退款审核DTO|body|true|RefundAuditDTO|RefundAuditDTO|
|&emsp;&emsp;id|退款申请ID||true|integer(int64)||
|&emsp;&emsp;pass|是否通过||true|boolean||
|&emsp;&emsp;auditReason|审核备注||false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|Result|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||object||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {}
}
```


## 申请退款


**接口地址**:`/aftersales/apply`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:


**请求示例**:


```javascript
{
  "orderId": 0,
  "type": 0,
  "reason": "",
  "images": ""
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|refundApplyDTO|退款申请DTO|body|true|RefundApplyDTO|RefundApplyDTO|
|&emsp;&emsp;orderId|订单ID||true|integer(int64)||
|&emsp;&emsp;type|类型: 1仅退款 2退货退款||true|integer(int32)||
|&emsp;&emsp;reason|退款原因||true|string||
|&emsp;&emsp;images|凭证图片(JSON数组)||false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|Result|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||object||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {}
}
```


## 我的售后申请


**接口地址**:`/aftersales/my`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|page||query|false|integer(int32)||
|size||query|false|integer(int32)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultIPageRefundApply|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||IPageRefundApply|IPageRefundApply|
|&emsp;&emsp;size||integer(int64)||
|&emsp;&emsp;current||integer(int64)||
|&emsp;&emsp;records||array|RefundApply|
|&emsp;&emsp;&emsp;&emsp;id||integer||
|&emsp;&emsp;&emsp;&emsp;orderId||integer||
|&emsp;&emsp;&emsp;&emsp;userId||integer||
|&emsp;&emsp;&emsp;&emsp;type||integer||
|&emsp;&emsp;&emsp;&emsp;reason||string||
|&emsp;&emsp;&emsp;&emsp;amount||number||
|&emsp;&emsp;&emsp;&emsp;images||string||
|&emsp;&emsp;&emsp;&emsp;originalOrderStatus||integer||
|&emsp;&emsp;&emsp;&emsp;status||integer||
|&emsp;&emsp;&emsp;&emsp;auditTime||string||
|&emsp;&emsp;&emsp;&emsp;auditReason||string||
|&emsp;&emsp;&emsp;&emsp;createTime||string||
|&emsp;&emsp;&emsp;&emsp;updateTime||string||
|&emsp;&emsp;pages||integer(int64)||
|&emsp;&emsp;total||integer(int64)||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {
		"size": 0,
		"current": 0,
		"records": [
			{
				"id": 0,
				"orderId": 0,
				"userId": 0,
				"type": 0,
				"reason": "",
				"amount": 0,
				"images": "",
				"originalOrderStatus": 0,
				"status": 0,
				"auditTime": "",
				"auditReason": "",
				"createTime": "",
				"updateTime": ""
			}
		],
		"pages": 0,
		"total": 0
	}
}
```


## 售后申请列表 (管理员-商家)


**接口地址**:`/aftersales/list`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|page||query|false|integer(int32)||
|size||query|false|integer(int32)||
|status||query|false|integer(int32)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultIPageRefundApply|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||IPageRefundApply|IPageRefundApply|
|&emsp;&emsp;size||integer(int64)||
|&emsp;&emsp;current||integer(int64)||
|&emsp;&emsp;records||array|RefundApply|
|&emsp;&emsp;&emsp;&emsp;id||integer||
|&emsp;&emsp;&emsp;&emsp;orderId||integer||
|&emsp;&emsp;&emsp;&emsp;userId||integer||
|&emsp;&emsp;&emsp;&emsp;type||integer||
|&emsp;&emsp;&emsp;&emsp;reason||string||
|&emsp;&emsp;&emsp;&emsp;amount||number||
|&emsp;&emsp;&emsp;&emsp;images||string||
|&emsp;&emsp;&emsp;&emsp;originalOrderStatus||integer||
|&emsp;&emsp;&emsp;&emsp;status||integer||
|&emsp;&emsp;&emsp;&emsp;auditTime||string||
|&emsp;&emsp;&emsp;&emsp;auditReason||string||
|&emsp;&emsp;&emsp;&emsp;createTime||string||
|&emsp;&emsp;&emsp;&emsp;updateTime||string||
|&emsp;&emsp;pages||integer(int64)||
|&emsp;&emsp;total||integer(int64)||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {
		"size": 0,
		"current": 0,
		"records": [
			{
				"id": 0,
				"orderId": 0,
				"userId": 0,
				"type": 0,
				"reason": "",
				"amount": 0,
				"images": "",
				"originalOrderStatus": 0,
				"status": 0,
				"auditTime": "",
				"auditReason": "",
				"createTime": "",
				"updateTime": ""
			}
		],
		"pages": 0,
		"total": 0
	}
}
```


# 管理员-药品管理


## 管理员强制下架-上架


**接口地址**:`/admin/medicine/{id}/status`


**请求方式**:`PATCH`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|id||path|true|integer(int64)||
|status||query|true|integer(int32)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|Result|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||object||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {}
}
```


## 批量上下架 (管理员)


**接口地址**:`/admin/medicine/batch/status`


**请求方式**:`PATCH`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:


**请求示例**:


```javascript
[]
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|status||query|true|integer(int32)||
|integers|integer|body|true|array||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|Result|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||object||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {}
}
```


## 管理员分页查询药品


**接口地址**:`/admin/medicine/list`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|query|药品查询参数|query|true|MedicineQueryDTO|MedicineQueryDTO|
|&emsp;&emsp;keyword|药品名称(模糊查询)||false|string||
|&emsp;&emsp;categoryId|分类ID||false|integer(int64)||
|&emsp;&emsp;isPrescription|是否处方药||false|integer(int32)||
|&emsp;&emsp;sortBy|排序字段: price(价格), sales(销量)||false|string||
|&emsp;&emsp;sortOrder|排序方式: asc(升序), desc(降序)||false|string||
|&emsp;&emsp;status|状态: 1上架 0下架 (仅管理员可用)||false|integer(int32)||
|&emsp;&emsp;page|页码||false|integer(int32)||
|&emsp;&emsp;size|每页大小||false|integer(int32)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultIPageMedicine|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||IPageMedicine|IPageMedicine|
|&emsp;&emsp;size||integer(int64)||
|&emsp;&emsp;current||integer(int64)||
|&emsp;&emsp;records||array|Medicine|
|&emsp;&emsp;&emsp;&emsp;id||integer||
|&emsp;&emsp;&emsp;&emsp;name||string||
|&emsp;&emsp;&emsp;&emsp;categoryId||integer||
|&emsp;&emsp;&emsp;&emsp;categoryName||string||
|&emsp;&emsp;&emsp;&emsp;mainImage||string||
|&emsp;&emsp;&emsp;&emsp;price||number||
|&emsp;&emsp;&emsp;&emsp;stock||integer||
|&emsp;&emsp;&emsp;&emsp;sales||integer||
|&emsp;&emsp;&emsp;&emsp;isPrescription||integer||
|&emsp;&emsp;&emsp;&emsp;indication||string||
|&emsp;&emsp;&emsp;&emsp;usageMethod||string||
|&emsp;&emsp;&emsp;&emsp;contraindication||string||
|&emsp;&emsp;&emsp;&emsp;expiryDate||string||
|&emsp;&emsp;&emsp;&emsp;productionDate||string||
|&emsp;&emsp;&emsp;&emsp;sellerId||integer||
|&emsp;&emsp;&emsp;&emsp;sellerName||string||
|&emsp;&emsp;&emsp;&emsp;status||integer||
|&emsp;&emsp;&emsp;&emsp;createTime||string||
|&emsp;&emsp;pages||integer(int64)||
|&emsp;&emsp;total||integer(int64)||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {
		"size": 0,
		"current": 0,
		"records": [
			{
				"id": 0,
				"name": "",
				"categoryId": 0,
				"categoryName": "",
				"mainImage": "",
				"price": 0,
				"stock": 0,
				"sales": 0,
				"isPrescription": 0,
				"indication": "",
				"usageMethod": "",
				"contraindication": "",
				"expiryDate": "",
				"productionDate": "",
				"sellerId": 0,
				"sellerName": "",
				"status": 0,
				"createTime": ""
			}
		],
		"pages": 0,
		"total": 0
	}
}
```


## 管理员删除药品


**接口地址**:`/admin/medicine/{id}`


**请求方式**:`DELETE`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|id||path|true|integer(int64)||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|Result|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||object||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {}
}
```


# 数据统计


## 获取管理端仪表盘数据


**接口地址**:`/statistics/dashboard`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


暂无


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultDashboardDataDTO|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||DashboardDataDTO|DashboardDataDTO|
|&emsp;&emsp;totalSales|总销售额|number||
|&emsp;&emsp;totalOrders|总订单数|integer(int64)||
|&emsp;&emsp;todaySales|今日销售额|number||
|&emsp;&emsp;todayOrders|今日订单数|integer(int64)||
|&emsp;&emsp;salesTrend|每日销售数据|array|DailySalesDTO|
|&emsp;&emsp;&emsp;&emsp;date|日期 (yyyy-MM-dd)|string||
|&emsp;&emsp;&emsp;&emsp;amount|销售额|number||
|&emsp;&emsp;&emsp;&emsp;orderCount|订单数|integer||
|&emsp;&emsp;topProducts|热销商品|array|TopProductDTO|
|&emsp;&emsp;&emsp;&emsp;medicineId|商品ID|integer||
|&emsp;&emsp;&emsp;&emsp;medicineName|商品名称|string||
|&emsp;&emsp;&emsp;&emsp;salesCount|销量|integer||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {
		"totalSales": 0,
		"totalOrders": 0,
		"todaySales": 0,
		"todayOrders": 0,
		"salesTrend": [
			{
				"date": "",
				"amount": 0,
				"orderCount": 0
			}
		],
		"topProducts": [
			{
				"medicineId": 0,
				"medicineName": "",
				"salesCount": 0
			}
		]
	}
}
```


# 首页管理


## 获取首页聚合数据


**接口地址**:`/api/home/index`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


暂无


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultHomeIndexVO|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int64)|integer(int64)|
|message||string||
|data||HomeIndexVO|HomeIndexVO|
|&emsp;&emsp;banners|轮播图列表|array|Banner|
|&emsp;&emsp;&emsp;&emsp;id||integer||
|&emsp;&emsp;&emsp;&emsp;title||string||
|&emsp;&emsp;&emsp;&emsp;imageUrl||string||
|&emsp;&emsp;&emsp;&emsp;linkUrl||string||
|&emsp;&emsp;&emsp;&emsp;sort||integer||
|&emsp;&emsp;&emsp;&emsp;status||integer||
|&emsp;&emsp;&emsp;&emsp;createTime||string||
|&emsp;&emsp;&emsp;&emsp;updateTime||string||
|&emsp;&emsp;categories|药品分类树|array|Category|
|&emsp;&emsp;&emsp;&emsp;id||integer||
|&emsp;&emsp;&emsp;&emsp;name||string||
|&emsp;&emsp;&emsp;&emsp;parentId||integer||
|&emsp;&emsp;&emsp;&emsp;level||integer||
|&emsp;&emsp;&emsp;&emsp;sort||integer||
|&emsp;&emsp;&emsp;&emsp;status||integer||
|&emsp;&emsp;&emsp;&emsp;createTime||string||
|&emsp;&emsp;&emsp;&emsp;updateTime||string||
|&emsp;&emsp;&emsp;&emsp;children||array|Category|
|&emsp;&emsp;hotMedicines|热门药品列表|array|Medicine|
|&emsp;&emsp;&emsp;&emsp;id||integer||
|&emsp;&emsp;&emsp;&emsp;name||string||
|&emsp;&emsp;&emsp;&emsp;categoryId||integer||
|&emsp;&emsp;&emsp;&emsp;categoryName||string||
|&emsp;&emsp;&emsp;&emsp;mainImage||string||
|&emsp;&emsp;&emsp;&emsp;price||number||
|&emsp;&emsp;&emsp;&emsp;stock||integer||
|&emsp;&emsp;&emsp;&emsp;sales||integer||
|&emsp;&emsp;&emsp;&emsp;isPrescription||integer||
|&emsp;&emsp;&emsp;&emsp;indication||string||
|&emsp;&emsp;&emsp;&emsp;usageMethod||string||
|&emsp;&emsp;&emsp;&emsp;contraindication||string||
|&emsp;&emsp;&emsp;&emsp;expiryDate||string||
|&emsp;&emsp;&emsp;&emsp;productionDate||string||
|&emsp;&emsp;&emsp;&emsp;sellerId||integer||
|&emsp;&emsp;&emsp;&emsp;sellerName||string||
|&emsp;&emsp;&emsp;&emsp;status||integer||
|&emsp;&emsp;&emsp;&emsp;createTime||string||
|&emsp;&emsp;recommendMedicines|推荐药品列表|array|Medicine|
|&emsp;&emsp;&emsp;&emsp;id||integer||
|&emsp;&emsp;&emsp;&emsp;name||string||
|&emsp;&emsp;&emsp;&emsp;categoryId||integer||
|&emsp;&emsp;&emsp;&emsp;categoryName||string||
|&emsp;&emsp;&emsp;&emsp;mainImage||string||
|&emsp;&emsp;&emsp;&emsp;price||number||
|&emsp;&emsp;&emsp;&emsp;stock||integer||
|&emsp;&emsp;&emsp;&emsp;sales||integer||
|&emsp;&emsp;&emsp;&emsp;isPrescription||integer||
|&emsp;&emsp;&emsp;&emsp;indication||string||
|&emsp;&emsp;&emsp;&emsp;usageMethod||string||
|&emsp;&emsp;&emsp;&emsp;contraindication||string||
|&emsp;&emsp;&emsp;&emsp;expiryDate||string||
|&emsp;&emsp;&emsp;&emsp;productionDate||string||
|&emsp;&emsp;&emsp;&emsp;sellerId||integer||
|&emsp;&emsp;&emsp;&emsp;sellerName||string||
|&emsp;&emsp;&emsp;&emsp;status||integer||
|&emsp;&emsp;&emsp;&emsp;createTime||string||


**响应示例**:
```javascript
{
	"code": 0,
	"message": "",
	"data": {
		"banners": [
			{
				"id": 0,
				"title": "",
				"imageUrl": "",
				"linkUrl": "",
				"sort": 0,
				"status": 0,
				"createTime": "",
				"updateTime": ""
			}
		],
		"categories": [
			{
				"id": 0,
				"name": "",
				"parentId": 0,
				"level": 0,
				"sort": 0,
				"status": 0,
				"createTime": "",
				"updateTime": "",
				"children": [
					{
						"id": 0,
						"name": "",
						"parentId": 0,
						"level": 0,
						"sort": 0,
						"status": 0,
						"createTime": "",
						"updateTime": "",
						"children": [
							{}
						]
					}
				]
			}
		],
		"hotMedicines": [
			{
				"id": 0,
				"name": "",
				"categoryId": 0,
				"categoryName": "",
				"mainImage": "",
				"price": 0,
				"stock": 0,
				"sales": 0,
				"isPrescription": 0,
				"indication": "",
				"usageMethod": "",
				"contraindication": "",
				"expiryDate": "",
				"productionDate": "",
				"sellerId": 0,
				"sellerName": "",
				"status": 0,
				"createTime": ""
			}
		],
		"recommendMedicines": [
			{
				"id": 0,
				"name": "",
				"categoryId": 0,
				"categoryName": "",
				"mainImage": "",
				"price": 0,
				"stock": 0,
				"sales": 0,
				"isPrescription": 0,
				"indication": "",
				"usageMethod": "",
				"contraindication": "",
				"expiryDate": "",
				"productionDate": "",
				"sellerId": 0,
				"sellerName": "",
				"status": 0,
				"createTime": ""
			}
		]
	}
}
```


# 优惠券管理


## 创建优惠券


**接口地址**:`/marketing/coupon/create`


**请求方式**:`POST`


**请求数据类型**:`application/json`


**响应数据类型**:`*/*`


**接口描述**:


**请求示例**:


```javascript
{
  "name": "新人专享券",
  "type": 0,
  "amount": 10,
  "minPoint": 0,
  "startTime": "2023-01-01 00:00:00",
  "endTime": "2023-12-31 23:59:59",
  "totalCount": 1000,
  "perLimit": 1
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|createDTO|创建参数|body|true|CouponCreateDTO|CouponCreateDTO|
|&emsp;&emsp;name|名称||true|string||
|&emsp;&emsp;type|类型:0全场 1分类 2商品||true|integer||
|&emsp;&emsp;amount|金额||true|number||
|&emsp;&emsp;minPoint|门槛||true|number||
|&emsp;&emsp;startTime|开始时间||true|string||
|&emsp;&emsp;endTime|结束时间||true|string||
|&emsp;&emsp;totalCount|总量||true|integer||
|&emsp;&emsp;perLimit|限领||true|integer||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|Result|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer|integer|
|message||string||
|data||object||


**响应示例**:
```javascript
{
	"code": 200,
	"message": "success",
	"data": null
}
```


## 分页查询优惠券 (管理端)


**接口地址**:`/marketing/coupon/page`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|page|页码|query|false|integer||
|size|每页大小|query|false|integer||
|name|名称|query|false|string||
|type|类型|query|false|integer||
|status|状态|query|false|integer||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultIPageCoupon|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer|integer|
|message||string||
|data||IPageCoupon|IPageCoupon|
|&emsp;&emsp;records||array|Coupon|
|&emsp;&emsp;total||integer||
|&emsp;&emsp;size||integer||
|&emsp;&emsp;current||integer||


**响应示例**:
```javascript
{
	"code": 200,
	"message": "success",
	"data": {
		"records": [],
		"total": 0
	}
}
```


## 更新优惠券


**接口地址**:`/marketing/coupon/update/{id}`


**请求方式**:`PUT`


**请求数据类型**:`application/json`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|id|优惠券ID|path|true|integer||
|createDTO|更新参数|body|true|CouponCreateDTO|CouponCreateDTO|


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|Result|


**响应示例**:
```javascript
{
	"code": 200,
	"message": "success",
	"data": null
}
```


## 删除优惠券


**接口地址**:`/marketing/coupon/delete/{id}`


**请求方式**:`DELETE`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|id|优惠券ID|path|true|integer||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|Result|


**响应示例**:
```javascript
{
	"code": 200,
	"message": "success",
	"data": null
}
```


## 更新状态


**接口地址**:`/marketing/coupon/status/{id}`


**请求方式**:`PUT`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|id|优惠券ID|path|true|integer||
|status|状态(0禁用 1启用)|query|true|integer||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|Result|


**响应示例**:
```javascript
{
	"code": 200,
	"message": "success",
	"data": null
}
```


# 用户优惠券


## 获取可领取列表


**接口地址**:`/marketing/coupon/list`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


暂无


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultListCoupon|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer|integer|
|message||string||
|data||array|Coupon|


**响应示例**:
```javascript
{
	"code": 200,
	"message": "success",
	"data": []
}
```


## 领取优惠券


**接口地址**:`/marketing/user-coupon/receive/{couponId}`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|couponId|优惠券ID|path|true|integer||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|Result|


**响应示例**:
```javascript
{
	"code": 200,
	"message": "success",
	"data": null
}
```


## 我的优惠券


**接口地址**:`/marketing/user-coupon/my`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|status|状态(0未使用 1已使用 2已过期)|query|false|integer||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultListUserCouponDTO|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer|integer|
|message||string||
|data||array|UserCouponDTO|


**响应示例**:
```javascript
{
	"code": 200,
	"message": "success",
	"data": []
}
```


# 药品收藏管理


## 收藏/取消收藏


**接口地址**:`/api/favorite/toggle`


**请求方式**:`POST`


**请求数据类型**:`application/json`


**响应数据类型**:`*/*`


**接口描述**:


**请求示例**:


```javascript
{
  "medicineId": 1
}
```


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|addDTO|收藏参数|body|true|FavoriteAddDTO|FavoriteAddDTO|
|&emsp;&emsp;medicineId|药品ID||true|integer||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|Result|


**响应示例**:
```javascript
{
	"code": 200,
	"message": "success",
	"data": null
}
```


## 检查是否已收藏


**接口地址**:`/api/favorite/check/{medicineId}`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|medicineId|药品ID|path|true|integer||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultBoolean|


**响应示例**:
```javascript
{
	"code": 200,
	"message": "success",
	"data": true
}
```


## 我的收藏列表


**接口地址**:`/api/favorite/list`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


暂无


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|ResultListFavoriteItem|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer|integer|
|message||string||
|data||object|IPageMedicine|
|&emsp;&emsp;records||array|Medicine|
|&emsp;&emsp;&emsp;&emsp;id|药品ID||integer||
|&emsp;&emsp;&emsp;&emsp;name|药品名称||string||
|&emsp;&emsp;&emsp;&emsp;mainImage|主图||string||
|&emsp;&emsp;&emsp;&emsp;price|价格||number||
|&emsp;&emsp;total||integer||
|&emsp;&emsp;size||integer||
|&emsp;&emsp;current||integer||


**响应示例**:
```javascript
{
	"code": 200,
	"message": "success",
	"data": {
		"records": [
			{
				"id": 1,
				"name": "感冒灵颗粒",
				"mainImage": "http://example.com/image.jpg",
				"price": 25.5
			}
		],
		"total": 1
	}
}
```