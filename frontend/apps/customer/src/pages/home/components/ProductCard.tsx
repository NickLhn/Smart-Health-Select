import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MedicineBoxOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import type { Medicine } from '../../../services/home';

interface ProductCardProps {
  product: Medicine;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const navigate = useNavigate();

  return (
    <div 
      className="glass-panel !bg-white/70 rounded-2xl p-3 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 cursor-pointer h-full flex flex-col group relative border-0 overflow-hidden"
      onClick={() => navigate(`/product/${product.id}`)}
    >
      <div className="relative aspect-square bg-gray-50 rounded-xl mb-3 overflow-hidden group-hover:bg-gray-100/50 transition-colors">
        {product.mainImage ? (
          <img 
            src={product.mainImage} 
            alt={product.name} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out mix-blend-multiply" 
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
            <MedicineBoxOutlined style={{ fontSize: 40, opacity: 0.5 }} />
          </div>
        )}
        {/* Quick Action Overlay (Desktop) */}
        <div className="absolute inset-x-0 bottom-0 p-3 flex justify-end opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
           <Button 
             type="primary" 
             shape="circle" 
             size="middle"
             className="bg-primary border-none shadow-lg hover:bg-primary-600 hover:scale-110 transition-all"
             icon={<ShoppingCartOutlined />}
             onClick={(e) => {
               e.stopPropagation();
               navigate(`/product/${product.id}`);
             }}
           />
        </div>
      </div>
      
      <div className="flex-1 flex flex-col">
        <h3 className="font-bold text-gray-800 line-clamp-2 mb-1.5 text-[14px] leading-snug group-hover:text-primary transition-colors font-display">
          {product.name}
        </h3>
        <p className="text-xs text-gray-400 mb-3 truncate bg-gray-50 py-1 px-2 rounded-md w-fit max-w-full font-medium border border-gray-100">
          {product.specs || '规格未知'}
        </p>
        
        <div className="flex justify-between items-end mt-auto">
          <div>
             <div className="text-rose-500 font-bold text-lg leading-none tracking-tight">
               <span className="text-xs mr-0.5 font-medium">¥</span>
               {product.price?.toFixed(2)}
             </div>
             <div className="text-gray-400 text-[10px] mt-1 font-medium">
               {product.sales > 1000 ? '已售 1k+' : `销量 ${product.sales}`}
             </div>
          </div>
          <Button 
            className="bg-primary-50 text-primary border-0 hover:bg-primary hover:text-white md:hidden transition-colors"
            size="small" 
            shape="circle"
            icon={<ShoppingCartOutlined />} 
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/product/${product.id}`);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
