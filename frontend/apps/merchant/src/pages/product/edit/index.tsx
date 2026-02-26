import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { App, Button, Card, Cascader, DatePicker, Form, Input, InputNumber, Modal, Select, Upload } from 'antd';
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

const flattenCategories = (tree: Category[]): Category[] => {
  let res: Category[] = [];
  tree.forEach((node) => {
    res.push(node);
    if (node.children && node.children.length > 0) {
      res = res.concat(flattenCategories(node.children));
    }
  });
  return res;
};

const mapCategoryTree = (data: Category[]): CategoryOption[] => {
  return data.map((item) => ({
    value: item.id,
    label: item.name,
    children: item.children && item.children.length > 0 ? mapCategoryTree(item.children) : undefined,
  }));
};

const findCategoryPath = (targetId: number, allCategories: Category[]): number[] => {
  const path: number[] = [];
  let currentId = targetId;
  let depth = 0;
  while (currentId !== 0 && depth < 10) {
    path.unshift(currentId);
    const cat = allCategories.find((c) => c.id === currentId);
    if (!cat) break;
    currentId = cat.parentId;
    depth++;
  }
  return path;
};

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

  const fetchCategories = useCallback(async () => {
    try {
      const res = await getCategoryList();
      if (res.code === 200) {
        const tree = res.data;
        setCategories(flattenCategories(tree));
        setCategoryOptions(mapCategoryTree(tree));
      }
    } catch {
      message.error('获取分类失败');
    }
  }, [message]);

  const fetchDetail = useCallback(async (productId: number) => {
    try {
      const res = await getMedicineDetail(productId);
      if (res.code === 200) {
        const { mainImage, categoryId, ...rest } = res.data;
        
        const categoryPath = findCategoryPath(categoryId, categories);

        form.setFieldsValue({
          ...rest,
          categoryId: categoryPath,
          isPrescription: Number(rest.isPrescription) ? 1 : 0,
          expiryDate: rest.expiryDate ? dayjs(rest.expiryDate) : null,
          productionDate: rest.productionDate ? dayjs(rest.productionDate) : null,
        });
        
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
    } catch {
      message.error('获取商品详情失败');
    }
  }, [categories, form, message]);

  useEffect(() => {
    // 获取分类列表
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    // 只有当分类加载完成且是编辑模式时，才去获取详情并回填
    // 这样可以确保 calculatePath 能找到对应的分类
    if (isEdit && categories.length > 0 && id) {
      fetchDetail(Number(id));
    }
  }, [categories.length, fetchDetail, id, isEdit]);

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
      message.error(error?.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  const pageStyles = `
    .pe-root {
      position: relative;
    }
    .pe-head {
      position: relative;
      overflow: hidden;
      border-radius: 18px;
      border: 1px solid rgba(15, 23, 42, 0.10);
      background:
        radial-gradient(900px 380px at 10% 10%, rgba(16, 185, 129, 0.22), rgba(16, 185, 129, 0) 55%),
        radial-gradient(760px 360px at 75% 18%, rgba(34, 211, 238, 0.18), rgba(34, 211, 238, 0) 60%),
        linear-gradient(180deg, rgba(255, 255, 255, 0.86) 0%, rgba(255, 255, 255, 0.76) 100%);
      box-shadow: 0 26px 80px rgba(2, 6, 23, 0.10);
      padding: 14px 14px 12px;
      margin-bottom: 16px;
    }
    .pe-head::after {
      content: '';
      position: absolute;
      inset: 0;
      pointer-events: none;
      opacity: 0.32;
      background-image: radial-gradient(rgba(15, 23, 42, 0.16) 1px, transparent 1px);
      background-size: 26px 26px;
      mask-image: radial-gradient(620px 460px at 65% 20%, rgba(0, 0, 0, 1), rgba(0, 0, 0, 0));
    }
    .pe-headTop {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 14px;
      flex-wrap: wrap;
    }
    .pe-back.ant-btn {
      border-radius: 999px;
      height: 36px;
      padding: 0 14px;
      font-weight: 650;
      border-color: rgba(15, 23, 42, 0.12);
      color: rgba(15, 23, 42, 0.78);
      background: rgba(255,255,255,0.78);
    }
    .pe-title {
      margin: 10px 0 0;
      font-size: 20px;
      font-weight: 900;
      letter-spacing: -0.3px;
      color: rgba(15, 23, 42, 0.92);
    }
    .pe-sub {
      margin-top: 6px;
      font-size: 12px;
      color: rgba(15, 23, 42, 0.58);
    }
    .pe-card {
      border-radius: 18px !important;
      border: 1px solid rgba(15, 23, 42, 0.10) !important;
      box-shadow: 0 18px 55px rgba(2, 6, 23, 0.06) !important;
      overflow: hidden;
      margin-bottom: 14px;
    }
    .pe-card .ant-card-head {
      border-bottom: 1px solid rgba(15, 23, 42, 0.08);
      background: rgba(255,255,255,0.86);
    }
    .pe-card .ant-card-head-title {
      font-weight: 850;
      color: rgba(15, 23, 42, 0.90);
    }
    .pe-card .ant-card-body {
      background: rgba(255,255,255,0.90);
    }
    .pe-form {
      max-width: 920px;
    }
    .pe-grid2 {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }
    .pe-uploadHint {
      margin-top: 8px;
      font-size: 12px;
      color: rgba(15, 23, 42, 0.55);
      line-height: 1.6;
    }
    .pe-footer {
      position: sticky;
      bottom: 0;
      z-index: 20;
      padding: 12px 12px;
      margin-top: 12px;
      border-radius: 18px;
      border: 1px solid rgba(15, 23, 42, 0.10);
      background: rgba(255, 255, 255, 0.86);
      backdrop-filter: blur(12px);
      box-shadow: 0 20px 70px rgba(2, 6, 23, 0.10);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }
    .pe-footerLeft {
      font-size: 12px;
      color: rgba(15, 23, 42, 0.58);
    }
    .pe-footerRight {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .pe-footerRight .ant-btn {
      border-radius: 999px;
      height: 38px;
      padding: 0 16px;
      font-weight: 750;
    }
    .pe-footerRight .pe-primary.ant-btn {
      background: linear-gradient(90deg, rgba(5, 150, 105, 1), rgba(16, 185, 129, 1));
      border: none;
      box-shadow: 0 14px 38px rgba(16, 185, 129, 0.22);
    }
    @media (max-width: 768px) {
      .pe-form { max-width: 100%; }
      .pe-footer { border-radius: 14px; }
      .pe-footerRight { width: 100%; justify-content: flex-end; }
      .pe-grid2 { grid-template-columns: 1fr; }
    }
    @media (prefers-reduced-motion: reduce) {
      .pe-footerRight .pe-primary.ant-btn { box-shadow: none; }
    }
  `;

  const modeText = useMemo(() => (isEdit ? '编辑商品' : '添加商品'), [isEdit]);
  const todayText = useMemo(() => dayjs().format('YYYY-MM-DD'), []);

  return (
    <div className="pe-root">
      <style>{pageStyles}</style>

      <div className="pe-head" aria-label="商品编辑头部">
        <div className="pe-headTop">
          <div style={{ minWidth: 220 }}>
            <Button className="pe-back" icon={<ArrowLeftOutlined />} onClick={() => navigate('/product/list')} aria-label="返回商品列表">
              返回列表
            </Button>
            <div className="pe-title">{modeText}</div>
            <div className="pe-sub">建议上传清晰主图与完整信息，提升用户转化（{todayText}）</div>
          </div>
        </div>
      </div>
      
      <Form
        form={form}
        name="product_form"
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          stock: 0,
          isPrescription: 0,
        }}
        className="pe-form"
      >
        <Card title="基础信息" className="pe-card" variant="outlined">
          <Form.Item label="商品名称" name="name" rules={[{ required: true, message: '请输入商品名称' }]}>
            <Input placeholder="例如：布洛芬缓释胶囊 0.3g*24粒" />
          </Form.Item>

          <Form.Item label="商品分类" name="categoryId" rules={[{ required: true, message: '请选择商品分类' }]}>
            <Cascader options={categoryOptions} placeholder="请选择商品分类" changeOnSelect showSearch />
          </Form.Item>

          <Form.Item label="处方药属性" name="isPrescription" rules={[{ required: true, message: '请选择是否处方药' }]}>
            <Select>
              <Option value={0}>非处方药 (OTC)</Option>
              <Option value={1}>处方药 (Rx)</Option>
            </Select>
          </Form.Item>
        </Card>

        <Card title="主图" className="pe-card" variant="outlined">
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
          <div className="pe-uploadHint">建议：正方形/接近正方形图片，清晰展示包装；避免水印、避免过暗。</div>
        </Card>

        <Card title="价格与库存" className="pe-card" variant="outlined">
          <div className="pe-grid2">
            <Form.Item name="price" label="售价" rules={[{ required: true, message: '请输入价格' }]}>
              <InputNumber style={{ width: '100%' }} prefix="¥" min={0} precision={2} placeholder="0.00" />
            </Form.Item>
            <Form.Item name="stock" label="库存" rules={[{ required: true, message: '请输入库存' }]}>
              <InputNumber style={{ width: '100%' }} min={0} precision={0} placeholder="0" />
            </Form.Item>
          </div>
        </Card>

        <Card title="说明信息" className="pe-card" variant="outlined">
          <Form.Item label="适应症" name="indication">
            <TextArea rows={3} placeholder="简要说明适应症，便于用户快速判断" />
          </Form.Item>

          <Form.Item label="用法用量" name="usageMethod">
            <TextArea rows={3} placeholder="例如：一次 1-2 粒，一日 2 次（请按药品说明书填写）" />
          </Form.Item>

          <Form.Item label="禁忌" name="contraindication">
            <TextArea rows={3} placeholder="例如：对本品成分过敏者禁用（请按说明书填写）" />
          </Form.Item>
        </Card>

        <Card title="日期信息" className="pe-card" variant="outlined">
          <div className="pe-grid2">
            <Form.Item name="productionDate" label="生产日期" rules={[{ required: true, message: '请选择生产日期' }]}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="expiryDate" label="有效期至" rules={[{ required: true, message: '请选择有效期' }]}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </div>
        </Card>

        <div className="pe-footer" aria-label="提交操作栏">
          <div className="pe-footerLeft">保存后将返回商品列表，可继续上下架或编辑</div>
          <div className="pe-footerRight">
            <Button onClick={() => navigate('/product/list')}>取消</Button>
            <Button className="pe-primary" type="primary" htmlType="submit" loading={loading}>
              {isEdit ? '保存修改' : '提交上架'}
            </Button>
          </div>
        </div>
      </Form>

      <Modal open={previewOpen} title={previewTitle} footer={null} onCancel={handleCancel}>
        <img alt={previewTitle || '预览图片'} style={{ width: '100%' }} src={previewImage} />
      </Modal>
    </div>
  );
};

export default ProductEdit;
