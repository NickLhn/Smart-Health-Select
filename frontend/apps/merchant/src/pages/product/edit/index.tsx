import React, { useState, useEffect, useMemo } from 'react';
import { Form, Input, Button, InputNumber, Select, Card, Upload, App, Cascader, DatePicker, Modal } from 'antd';
import { ArrowLeftOutlined, PlusOutlined } from '@ant-design/icons';
import type { RcFile, UploadProps } from 'antd/es/upload';
import type { UploadFile } from 'antd/es/upload/interface';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { createMedicine, updateMedicine, getMedicineDetail, getCategoryList } from '../../../services/product';
import type { Category } from '../../../services/product';
import { uploadFile } from '../../../services/file';

const { TextArea } = Input;
const { Option } = Select;

interface CategoryOption {
  value: number;
  label: string;
  children?: CategoryOption[];
}

const getBase64 = (file: RcFile): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

const ProductEdit: React.FC = () => {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [form] = Form.useForm();
  
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 获取分类列表
    fetchCategories();
  }, []);

  useEffect(() => {
    // 只有当分类加载完成且是编辑模式时，才去获取详情并回填
    // 这样可以确保 calculatePath 能找到对应的分类
    if (isEdit && categories.length > 0) {
      fetchDetail(Number(id));
    }
  }, [id, categories]); // 依赖 categories

  const fetchCategories = async () => {
    try {
      const res = await getCategoryList();
      if (res.code === 200) {
        const tree = res.data;
        // The backend returns a tree, so we need to flatten it for findCategoryPath
        // and map it for Cascader options
        setCategories(flattenCategories(tree));
        setCategoryOptions(mapCategoryTree(tree));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const flattenCategories = (tree: Category[]): Category[] => {
    let res: Category[] = [];
    tree.forEach(node => {
      res.push(node);
      if (node.children && node.children.length > 0) {
        res = res.concat(flattenCategories(node.children));
      }
    });
    return res;
  };

  const mapCategoryTree = (data: Category[]): CategoryOption[] => {
    return data.map(item => ({
      value: item.id,
      label: item.name,
      children: item.children && item.children.length > 0 ? mapCategoryTree(item.children) : undefined,
    }));
  };

  // 查找分类路径 [rootId, childId, leafId]
  const findCategoryPath = (targetId: number, allCategories: Category[]): number[] => {
    const path: number[] = [];
    let currentId = targetId;
    let depth = 0;
    while (currentId !== 0 && depth < 10) {
      path.unshift(currentId);
      const cat = allCategories.find(c => c.id === currentId);
      if (!cat) break;
      currentId = cat.parentId;
      depth++;
    }
    return path;
  };

  const fetchDetail = async (productId: number) => {
    try {
      const res = await getMedicineDetail(productId);
      if (res.code === 200) {
        const { mainImage, categoryId, ...rest } = res.data;
        
        // 计算分类路径
        const categoryPath = findCategoryPath(categoryId, categories);

        form.setFieldsValue({
          ...rest,
          categoryId: categoryPath, // 设置为数组路径
          // 处理布尔值/数字状态
          isPrescription: rest.isPrescription ? 1 : 0,
          // 处理日期
          expiryDate: rest.expiryDate ? dayjs(rest.expiryDate) : null,
          productionDate: rest.productionDate ? dayjs(rest.productionDate) : null,
        });
        
        // 设置图片
        if (mainImage) {
          const imgList: UploadFile[] = [
            {
              uid: '-1',
              name: 'main.png',
              status: 'done',
              url: mainImage,
            },
          ];
          setFileList(imgList);
          form.setFieldValue('images', imgList);
        }
      }
    } catch (error) {
      message.error('获取商品详情失败');
    }
  };

  const handleCancel = () => setPreviewOpen(false);

  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as RcFile);
    }

    setPreviewImage(file.url || (file.preview as string));
    setPreviewOpen(true);
    setPreviewTitle(file.name || file.url!.substring(file.url!.lastIndexOf('/') + 1));
  };

  const handleChange: UploadProps['onChange'] = ({ fileList: newFileList }) => setFileList(newFileList);

  const customRequest = async (options: any) => {
    const { onSuccess, onError, file } = options;
    try {
      const res = await uploadFile(file);
      if (res.code === 200) {
        onSuccess(res);
      } else {
        onError(new Error(res.message));
        message.error(res.message);
      }
    } catch (err) {
      onError(err);
      message.error('上传失败');
    }
  };

  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>上传</div>
    </div>
  );

  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      let mainImage = '';
      if (fileList.length > 0) {
        const file = fileList[0];
        if (file.url) {
          mainImage = file.url;
        } else if (file.response && (file.response as any).code === 200) {
          mainImage = (file.response as any).data;
        }
      }

      if (!mainImage && fileList.length > 0) {
          message.error('图片上传未完成或失败，请重新上传');
          setLoading(false);
          return;
      }

      const payload = {
        ...values,
        categoryId: Array.isArray(values.categoryId) ? values.categoryId[values.categoryId.length - 1] : values.categoryId,
        mainImage,
        isPrescription: values.isPrescription,
        expiryDate: values.expiryDate ? values.expiryDate.format('YYYY-MM-DD') : null,
        productionDate: values.productionDate ? values.productionDate.format('YYYY-MM-DD') : null,
      };

      let res;
      if (isEdit) {
        res = await updateMedicine(Number(id), payload);
      } else {
        res = await createMedicine(payload);
      }

      if (res.code === 200) {
        message.success(`${isEdit ? '修改' : '添加'}成功`);
        navigate('/product/list');
      } else {
        message.error(res.message || '操作失败');
      }
    } catch (error: any) {
      console.error(error);
      message.error(error.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate('/product/list')}>
          返回列表
        </Button>
        <span style={{ fontSize: 20, fontWeight: 'bold', verticalAlign: 'middle' }}>
          {isEdit ? '编辑商品' : '添加商品'}
        </span>
      </div>
      
      <Card variant="borderless">
        <Form
          form={form}
          name="product_form"
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            status: 1, // 1: 上架
            stock: 0,
            isPrescription: 0 // 默认非处方
          }}
          style={{ maxWidth: 800 }}
        >
          <Form.Item
            label="商品名称"
            name="name"
            rules={[{ required: true, message: '请输入商品名称' }]}
          >
            <Input placeholder="请输入商品名称" />
          </Form.Item>

          <Form.Item
            label="商品主图"
            name="images"
            valuePropName="fileList"
            getValueFromEvent={normFile}
            rules={[{ required: true, message: '请上传商品主图' }]}
          >
            <Upload
              listType="picture-card"
              fileList={fileList}
              onPreview={handlePreview}
              onChange={handleChange}
              customRequest={customRequest}
              maxCount={1}
            >
              {fileList.length >= 1 ? null : uploadButton}
            </Upload>
          </Form.Item>

          <Form.Item
            label="商品分类"
            name="categoryId"
            rules={[{ required: true, message: '请选择商品分类' }]}
          >
            <Cascader 
              options={categoryOptions} 
              placeholder="请选择商品分类" 
              changeOnSelect 
              showSearch
            />
          </Form.Item>

          <Form.Item label="价格 / 库存" style={{ marginBottom: 0 }}>
            <Form.Item
              name="price"
              rules={[{ required: true, message: '请输入价格' }]}
              style={{ display: 'inline-block', width: 'calc(50% - 8px)' }}
            >
              <InputNumber 
                style={{ width: '100%' }} 
                prefix="¥" 
                min={0} 
                precision={2} 
                placeholder="价格"
              />
            </Form.Item>
            <Form.Item
              name="stock"
              rules={[{ required: true, message: '请输入库存' }]}
              style={{ display: 'inline-block', width: 'calc(50% - 8px)', margin: '0 0 0 16px' }}
            >
              <InputNumber 
                style={{ width: '100%' }} 
                min={0} 
                precision={0} 
                placeholder="库存"
              />
            </Form.Item>
          </Form.Item>

          <Form.Item
            label="处方药属性"
            name="isPrescription"
            rules={[{ required: true, message: '请选择是否处方药' }]}
          >
             <Select>
              <Option value={0}>非处方药 (OTC)</Option>
              <Option value={1}>处方药 (Rx)</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="适应症"
            name="indication"
          >
            <TextArea rows={3} placeholder="请输入适应症" />
          </Form.Item>

          <Form.Item
            label="用法用量"
            name="usageMethod"
          >
            <TextArea rows={3} placeholder="请输入用法用量" />
          </Form.Item>

          <Form.Item
            label="禁忌"
            name="contraindication"
          >
            <TextArea rows={3} placeholder="请输入禁忌" />
          </Form.Item>

          <Form.Item label="日期信息" style={{ marginBottom: 0 }}>
             <Form.Item
              name="productionDate"
              label="生产日期"
              rules={[{ required: true, message: '请选择生产日期' }]}
              style={{ display: 'inline-block', width: 'calc(50% - 8px)' }}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="expiryDate"
              label="有效期至"
              rules={[{ required: true, message: '请选择有效期' }]}
              style={{ display: 'inline-block', width: 'calc(50% - 8px)', margin: '0 0 0 16px' }}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Form.Item>

          {/* 状态字段通常在列表中管理，这里也可以加上，或者默认上架 */}
          {/* 
          <Form.Item
            label="状态"
            name="status"
          >
             <Select>
              <Option value={1}>上架</Option>
              <Option value={0}>下架</Option>
            </Select>
          </Form.Item> 
          */}

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              提交
            </Button>
            <Button style={{ marginLeft: 8 }} onClick={() => navigate('/product/list')}>
              取消
            </Button>
          </Form.Item>
        </Form>
      </Card>
      
      <Modal open={previewOpen} title={previewTitle} footer={null} onCancel={handleCancel}>
        <img alt="example" style={{ width: '100%' }} src={previewImage} />
      </Modal>
    </div>
  );
};

export default ProductEdit;
