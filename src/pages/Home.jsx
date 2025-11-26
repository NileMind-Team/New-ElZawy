import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  FaSearch,
  FaShoppingCart,
  FaPlus,
  FaEdit,
  FaTrash,
  FaCheckCircle,
  FaTimesCircle,
  FaList,
  FaEye,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import axiosInstance from "../api/axiosInstance";

const Home = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState([]);
  const [isAdminOrRestaurantOrBranch, setIsAdminOrRestaurantOrBranch] =
    useState(false);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [showCategoriesManager, setShowCategoriesManager] = useState(false);
  const [categories, setCategories] = useState([
    { id: "all", name: "جميع العناصر" },
  ]);
  const categoriesContainerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setIsAdminOrRestaurantOrBranch(false);
          setLoading(false);
          return;
        }

        const response = await axiosInstance.get("/api/Account/Profile", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const userData = response.data;
        const userRoles = userData.roles || [];

        const hasAdminOrRestaurantOrBranchRole =
          userRoles.includes("Admin") ||
          userRoles.includes("Restaurant") ||
          userRoles.includes("Branch");

        setIsAdminOrRestaurantOrBranch(hasAdminOrRestaurantOrBranchRole);
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setIsAdminOrRestaurantOrBranch(false);
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axiosInstance.get("/api/Categories/GetAll");
        const categoriesData = response.data;

        const transformedCategories = [
          { id: "all", name: "جميع العناصر" },
          ...categoriesData.map((category) => ({
            id: category.id.toString(),
            name: category.name,
            isActive: category.isActive,
            originalId: category.id,
          })),
        ];

        setCategories(transformedCategories);
      } catch (error) {
        console.error("Error fetching categories:", error);
        Swal.fire({
          icon: "error",
          title: "خطأ",
          text: "فشل في تحميل التصنيفات",
          timer: 2000,
          showConfirmButton: false,
        });
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setProductsLoading(true);

        const params = {};
        if (selectedCategory !== "all") {
          params.categoryId = parseInt(selectedCategory);
        }

        const response = await axiosInstance.get("/api/MenuItems/GetAllWithoutPagination", {
          params,
        });
        const productsData = response.data;

        const transformedProducts = productsData.map((product) => ({
          id: product.id,
          name: product.name,
          category: product.category?.name?.toLowerCase() || "meals",
          categoryId: product.category?.id,
          price: product.basePrice,
          image: product.imageUrl
            ? `https://restaurant-template.runasp.net/${product.imageUrl}`
            : "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=400&h=300&fit=crop",
          ingredients: [],
          description: product.description,
          isActive: product.isActive,
          calories: product.calories,
          preparationTimeStart: product.preparationTimeStart,
          preparationTimeEnd: product.preparationTimeEnd,
          availabilityTime: {
            alwaysAvailable: product.isAllTime,
            startTime:
              product.menuItemSchedules?.[0]?.startTime?.substring(0, 5) || "",
            endTime:
              product.menuItemSchedules?.[0]?.endTime?.substring(0, 5) || "",
          },
          availabilityDays: {
            everyday: product.isAllTime,
            specificDays:
              product.menuItemSchedules?.map((schedule) =>
                getDayName(schedule.day)
              ) || [],
          },
          menuItemSchedules: product.menuItemSchedules || [],
        }));

        setProducts(transformedProducts);
        setFilteredProducts(transformedProducts);
      } catch (error) {
        console.error("Error fetching products:", error);
        Swal.fire({
          icon: "error",
          title: "خطأ",
          text: "فشل في تحميل المنتجات",
          timer: 2000,
          showConfirmButton: false,
        });
      } finally {
        setProductsLoading(false);
      }
    };

    fetchProducts();
  }, [selectedCategory]);

  const getDayName = (dayNumber) => {
    const days = [
      "الأحد",
      "الإثنين",
      "الثلاثاء",
      "الأربعاء",
      "الخميس",
      "الجمعة",
      "السبت",
    ];
    return days[dayNumber - 1] || "";
  };

  useEffect(() => {
    if (!searchTerm) {
      setFilteredProducts(products);
      return;
    }

    const filtered = products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.ingredients.some((ingredient) =>
          ingredient.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    setFilteredProducts(filtered);
  }, [searchTerm, products]);

  const handleProductDetails = (product) => {
    navigate(`/product/${product.id}`, { state: { product } });
  };

  const handleAddToCart = (product, e) => {
    e.stopPropagation();

    if (!product.isActive) {
      Swal.fire({
        icon: "error",
        title: "المنتج غير متوفر",
        text: `${product.name} غير متوفر حالياً`,
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }

    const existingItem = cart.find((item) => item.id === product.id);

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }

    Swal.fire({
      icon: "success",
      title: "تم الإضافة إلى السلة!",
      text: `تم إضافة ${product.name} إلى سلة التسوق`,
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const handleEditProduct = (product, e) => {
    e.stopPropagation();
    navigate("/products/edit", { state: { productId: product.id } });
  };

  const handleDeleteProduct = async (productId, e) => {
    e.stopPropagation();

    Swal.fire({
      title: "هل أنت متأكد؟",
      text: "لن تتمكن من التراجع عن هذا الإجراء!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#E41E26",
      cancelButtonColor: "#6B7280",
      confirmButtonText: "نعم، احذفه!",
      cancelButtonText: "إلغاء",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axiosInstance.delete(`/api/MenuItems/Delete/${productId}`);

          setProducts(products.filter((product) => product.id !== productId));
          Swal.fire({
            title: "تم الحذف!",
            text: "تم حذف المنتج بنجاح",
            icon: "success",
            timer: 2000,
            showConfirmButton: false,
          });
        } catch (error) {
          console.error("Error deleting product:", error);
          Swal.fire({
            icon: "error",
            title: "خطأ",
            text: "فشل في حذف المنتج",
            timer: 2000,
            showConfirmButton: false,
          });
        }
      }
    });
  };

  const handleToggleActive = async (productId, e) => {
    e.stopPropagation();

    try {
      await axiosInstance.put(
        `/api/MenuItems/ChangeMenuItemActiveStatus/${productId}`
      );

      setProducts(
        products.map((product) =>
          product.id === productId
            ? { ...product, isActive: !product.isActive }
            : product
        )
      );

      setFilteredProducts(
        filteredProducts.map((product) =>
          product.id === productId
            ? { ...product, isActive: !product.isActive }
            : product
        )
      );

      Swal.fire({
        icon: "success",
        title: "تم تحديث الحالة!",
        text: `تم ${
          products.find((p) => p.id === productId).isActive ? "تعطيل" : "تفعيل"
        } المنتج`,
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Error updating product status:", error);
      Swal.fire({
        icon: "error",
        title: "خطأ",
        text: "فشل في تحديث حالة المنتج",
        timer: 2000,
        showConfirmButton: false,
      });
    }
  };

  const handleAddNewProduct = () => {
    navigate("/products/new");
  };

  const handleOpenCategoriesManager = () => {
    setShowCategoriesManager(true);
    document.body.style.overflow = "hidden";
  };

  const scrollCategories = (direction) => {
    const container = categoriesContainerRef.current;
    if (container) {
      const scrollAmount = 200;
      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - categoriesContainerRef.current.offsetLeft);
    setScrollLeft(categoriesContainerRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - categoriesContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    categoriesContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleTouchStart = (e) => {
    setIsDragging(true);
    setStartX(e.touches[0].pageX - categoriesContainerRef.current.offsetLeft);
    setScrollLeft(categoriesContainerRef.current.scrollLeft);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const x = e.touches[0].pageX - categoriesContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    categoriesContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const isArabic = (text) => {
    const arabicRegex = /[\u0600-\u06FF]/;
    return arabicRegex.test(text);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-[#fff8e7] to-[#ffe5b4] dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 px-4">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#E41E26]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#fff8e7] to-[#ffe5b4] dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 font-sans relative overflow-x-hidden transition-colors duration-300">
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -left-20 -top-20 w-80 h-80 bg-gradient-to-r from-[#E41E26]/10 to-[#FDB913]/10 dark:from-[#E41E26]/5 dark:to-[#FDB913]/5 rounded-full blur-3xl"></div>
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-gradient-to-r from-[#FDB913]/10 to-[#E41E26]/10 dark:from-[#FDB913]/5 dark:to-[#E41E26]/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative bg-gradient-to-r from-[#E41E26] to-[#FDB913] text-white py-8 md:py-16 px-4 text-center w-full">
        <div className="max-w-4xl mx-auto relative z-10 w-full">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 px-2 text-center"
            dir="rtl"
          >
            <span className="block sm:inline">مرحباً بكم في</span>{" "}
            <span className="block sm:inline">Chicken One</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-lg md:text-xl lg:text-2xl opacity-90 mb-6 md:mb-8 px-2"
          >
            طعام لذيذ، يصل إليك طازجاً
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative max-w-2xl mx-auto w-full px-2"
          >
            <div className="relative">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
              <input
                type="text"
                placeholder="ابحث عن أطباقك المفضلة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 md:py-4 rounded-2xl border-none outline-none text-gray-800 dark:text-gray-200 dark:bg-gray-700 shadow-2xl focus:ring-2 focus:ring-[#E41E26] text-sm md:text-base text-right"
                dir="rtl"
              />
            </div>
          </motion.div>
        </div>
      </div>

      <div className="relative max-w-6xl mx-auto -mt-6 md:-mt-8 px-2 sm:px-4 z-20 w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-3 md:p-4 relative w-full transition-colors duration-300">
          <button
            onClick={() => scrollCategories("left")}
            className="absolute left-1 md:left-2 top-1/2 transform -translate-y-1/2 bg-white/90 dark:bg-gray-700/90 backdrop-blur-sm rounded-full p-2 text-gray-600 dark:text-gray-300 hover:text-[#E41E26] transition-colors duration-200 hover:scale-110 z-10 shadow-lg"
          >
            <FaChevronLeft size={14} className="sm:w-4" />
          </button>

          <div
            ref={categoriesContainerRef}
            className="flex overflow-x-auto scrollbar-hide gap-2 md:gap-4 px-6 sm:px-8 cursor-grab active:cursor-grabbing select-none"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              direction: "rtl",
            }}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {categories.map((category) => (
              <motion.button
                key={category.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-3 md:px-4 py-2 md:py-3 rounded-xl font-semibold transition-all duration-300 text-sm md:text-base ${
                  selectedCategory === category.id
                    ? "bg-gradient-to-r from-[#E41E26] to-[#FDB913] text-white shadow-lg"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                } ${
                  !category.isActive && category.id !== "all"
                    ? "opacity-60"
                    : ""
                }`}
                style={{ direction: "rtl" }}
              >
                <span className="whitespace-nowrap">{category.name}</span>
                {category.id !== "all" && !category.isActive && (
                  <span className="text-xs text-red-500">(معطل)</span>
                )}
              </motion.button>
            ))}
          </div>

          <button
            onClick={() => scrollCategories("right")}
            className="absolute right-1 md:right-2 top-1/2 transform -translate-y-1/2 bg-white/90 dark:bg-gray-700/90 backdrop-blur-sm rounded-full p-2 text-gray-600 dark:text-gray-300 hover:text-[#E41E26] transition-colors duration-200 hover:scale-110 z-10 shadow-lg"
          >
            <FaChevronRight size={14} className="sm:w-4" />
          </button>
        </div>
      </div>

      <div className="relative z-10 w-full">
        {productsLoading ? (
          <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 md:py-6 w-full">
            <div className="text-center py-12 md:py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-lg mx-2 transition-colors duration-300">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#E41E26] mx-auto mb-4"></div>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 md:py-6 w-full">
            <div className="text-center py-12 md:py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-lg mx-2 transition-colors duration-300">
              <FaSearch className="mx-auto text-4xl md:text-6xl text-gray-400 mb-4" />
              <h3 className="text-xl md:text-2xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                لم يتم العثور على منتجات
              </h3>
              <p className="text-gray-500 dark:text-gray-500 mb-4 px-4">
                حاول تعديل معايير البحث أو التصفية
              </p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("all");
                }}
                className="bg-gradient-to-r from-[#E41E26] to-[#FDB913] text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all text-sm md:text-base"
              >
                عرض جميع المنتجات
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 md:py-6 w-full relative">
            <motion.div
              layout
              className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6 relative"
              style={{ direction: "rtl" }}
            >
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                  className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-700 cursor-pointer group w-full relative ${
                    !product.isActive ? "opacity-70" : ""
                  } ${productsLoading ? "opacity-50" : ""}`}
                >
                  <div
                    className={`absolute top-2 right-2 z-10 px-2 py-1 rounded-full text-xs font-semibold ${
                      product.isActive
                        ? "bg-green-500 text-white"
                        : "bg-red-500 text-white"
                    }`}
                  >
                    {product.isActive ? "نشط" : "غير نشط"}
                  </div>

                  {isAdminOrRestaurantOrBranch && (
                    <div className="absolute top-2 left-2 z-10 flex gap-1">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => handleToggleActive(product.id, e)}
                        className={`p-2 rounded-lg shadow-lg transition-colors flex items-center gap-1 text-xs ${
                          product.isActive
                            ? "bg-yellow-500 text-white hover:bg-yellow-600"
                            : "bg-green-500 text-white hover:bg-green-600"
                        }`}
                      >
                        {product.isActive ? (
                          <FaTimesCircle size={12} />
                        ) : (
                          <FaCheckCircle size={12} />
                        )}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => handleEditProduct(product, e)}
                        className="bg-blue-500 text-white p-2 rounded-lg shadow-lg hover:bg-blue-600 transition-colors"
                      >
                        <FaEdit size={12} />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => handleDeleteProduct(product.id, e)}
                        className="bg-red-500 text-white p-2 rounded-lg shadow-lg hover:bg-red-600 transition-colors"
                      >
                        <FaTrash size={12} />
                      </motion.button>
                    </div>
                  )}

                  <div className="relative h-40 sm:h-48 overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>

                  <div className="p-3 sm:p-4">
                    <h3
                      className="font-bold text-base sm:text-lg text-gray-800 dark:text-gray-200 mb-2 group-hover:text-[#E41E26] transition-colors line-clamp-1"
                      dir={isArabic(product.name) ? "rtl" : "ltr"}
                    >
                      {product.name}
                    </h3>
                    <p
                      className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mb-3 line-clamp-2 leading-relaxed"
                      dir={isArabic(product.description) ? "rtl" : "ltr"}
                    >
                      {product.description}
                    </p>

                    <div className="flex items-center justify-between mb-3">
                      <div className="text-[#E41E26] font-bold text-lg sm:text-xl">
                        {product.price} ج.م
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3 sm:mt-4">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => handleAddToCart(product, e)}
                        disabled={!product.isActive || productsLoading}
                        className={`flex-1 py-2 sm:py-2.5 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm ${
                          product.isActive && !productsLoading
                            ? "bg-gradient-to-r from-[#E41E26] to-[#FDB913] text-white"
                            : "bg-gray-400 text-gray-200 cursor-not-allowed"
                        }`}
                      >
                        <FaShoppingCart className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        <span className="xs:hidden">
                          {product.isActive && !productsLoading
                            ? "أضف إلى السلة"
                            : "غير متوفر"}
                        </span>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() =>
                          !productsLoading && handleProductDetails(product)
                        }
                        disabled={productsLoading}
                        className={`flex-1 py-2 sm:py-2.5 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm ${
                          !productsLoading
                            ? "bg-gradient-to-r from-gray-600 to-gray-800 text-white"
                            : "bg-gray-400 text-gray-200 cursor-not-allowed"
                        }`}
                      >
                        <FaEye className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        <span className="xs:hidden">عرض التفاصيل</span>
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        )}
      </div>

      {isAdminOrRestaurantOrBranch && (
        <div className="fixed bottom-4 left-4 flex flex-col gap-3 z-40">
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleAddNewProduct}
            className="bg-green-500 text-white rounded-full p-3 sm:p-4 shadow-2xl hover:bg-green-600 transition-colors duration-200"
          >
            <FaPlus className="w-4 h-4 sm:w-6 sm:h-6" />
          </motion.button>

          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleOpenCategoriesManager}
            className="bg-purple-500 text-white rounded-full p-3 sm:p-4 shadow-2xl hover:bg-purple-600 transition-colors duration-200"
          >
            <FaList className="w-4 h-4 sm:w-6 sm:h-6" />
          </motion.button>
        </div>
      )}

      {cart.length > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 bg-gradient-to-r from-[#E41E26] to-[#FDB913] text-white rounded-full p-3 sm:p-4 shadow-2xl z-40 cursor-pointer hover:scale-110 transition-transform duration-200"
          onClick={() => navigate("/cart")}
        >
          <div className="relative">
            <FaShoppingCart className="w-4 h-4 sm:w-6 sm:h-6" />
            <span className="absolute -top-2 -right-2 bg-white text-[#E41E26] rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-xs font-bold">
              {cart.reduce((total, item) => total + item.quantity, 0)}
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Home;
