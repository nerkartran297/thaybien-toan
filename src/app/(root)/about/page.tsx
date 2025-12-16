import Navigation from "@/app/components/Navigation";
import Image from "next/image";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* Hero Section */}
      <div className="relative h-96 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/wallpaper-2.jpg"
            alt="About Us Background"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        </div>
        <div className="relative h-full flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-lg">
              Về Chúng Tôi
            </h1>
            <p className="text-xl text-white/90 drop-shadow-md">
              Phuc Nguyen Guitar - Nơi âm nhạc được tôn vinh
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Company Story */}
        <section className="mb-16">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-[#2c3e50] mb-6">
                Câu Chuyện Của Chúng Tôi
              </h2>
              <div className="space-y-4 text-[#654321] leading-relaxed">
                <p>
                  Phuc Nguyen Guitar được thành lập với niềm đam mê âm nhạc và
                  mong muốn mang đến những cây đàn guitar chất lượng cao cho
                  cộng đồng yêu nhạc Việt Nam.
                </p>
                <p>
                  Từ một cửa hàng nhỏ với vài cây đàn guitar cũ, chúng tôi đã
                  phát triển thành một trong những địa chỉ tin cậy hàng đầu về
                  đàn guitar và phụ kiện âm nhạc tại Việt Nam.
                </p>
                <p>
                  Với hơn 10 năm kinh nghiệm trong ngành, chúng tôi hiểu rõ nhu
                  cầu và mong muốn của từng nghệ sĩ, từ người mới bắt đầu đến
                  những tay guitar chuyên nghiệp.
                </p>
              </div>
            </div>
            <div className="relative">
              <Image
                src="/wallpaper-1.jpg"
                alt="Our Story"
                width={600}
                height={400}
                className="rounded-lg shadow-lg"
              />
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="mb-16">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-[#F8F9FA] p-8 rounded-lg">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-[#D4A047] rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-[#2c3e50] mb-4">
                  Sứ Mệnh
                </h3>
              </div>
              <p className="text-[#654321] leading-relaxed">
                Chúng tôi cam kết mang đến những sản phẩm guitar và phụ kiện
                chất lượng cao với giá cả hợp lý, đồng thời cung cấp dịch vụ tư
                vấn chuyên nghiệp để mỗi khách hàng tìm được cây đàn phù hợp
                nhất với phong cách âm nhạc của mình.
              </p>
            </div>

            <div className="bg-[#F8F9FA] p-8 rounded-lg">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-[#D4A047] rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-[#2c3e50] mb-4">
                  Tầm Nhìn
                </h3>
              </div>
              <p className="text-[#654321] leading-relaxed">
                Trở thành thương hiệu hàng đầu về đàn guitar tại Việt Nam, góp
                phần phát triển cộng đồng âm nhạc và nuôi dưỡng tài năng trẻ.
                Chúng tôi mong muốn mỗi cây đàn từ Phuc Nguyen Guitar sẽ là
                người bạn đồng hành trong hành trình âm nhạc của bạn.
              </p>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="mb-16">
          <h2 className="text-4xl font-bold text-[#2c3e50] text-center mb-12">
            Giá Trị Cốt Lõi
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-[#D4A047] rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#2c3e50] mb-4">
                Chất Lượng
              </h3>
              <p className="text-[#654321]">
                Chỉ bán những sản phẩm đã được kiểm định chất lượng kỹ lưỡng từ
                các thương hiệu uy tín.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-[#D4A047] rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#2c3e50] mb-4">Đam Mê</h3>
              <p className="text-[#654321]">
                Chúng tôi yêu âm nhạc và hiểu rõ niềm đam mê của mỗi nghệ sĩ
                guitar.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-[#D4A047] rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#2c3e50] mb-4">
                Cộng Đồng
              </h3>
              <p className="text-[#654321]">
                Xây dựng cộng đồng yêu nhạc mạnh mẽ, nơi mọi người có thể chia
                sẻ đam mê.
              </p>
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="mb-16">
          <h2 className="text-4xl font-bold text-[#2c3e50] text-center mb-12">
            Đội Ngũ Của Chúng Tôi
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-32 h-32 bg-gray-300 rounded-full mx-auto mb-6 flex items-center justify-center">
                <span className="text-4xl text-gray-600">👨‍💼</span>
              </div>
              <h3 className="text-xl font-bold text-[#2c3e50] mb-2">
                Phúc Nguyễn
              </h3>
              <p className="text-[#D4A047] font-semibold mb-2">Founder & CEO</p>
              <p className="text-[#654321] text-sm">
                Với hơn 15 năm kinh nghiệm trong ngành âm nhạc, Phúc là người
                sáng lập và dẫn dắt Phuc Nguyen Guitar từ những ngày đầu.
              </p>
            </div>

            <div className="text-center">
              <div className="w-32 h-32 bg-gray-300 rounded-full mx-auto mb-6 flex items-center justify-center">
                <span className="text-4xl text-gray-600">🎸</span>
              </div>
              <h3 className="text-xl font-bold text-[#2c3e50] mb-2">
                Minh Đức
              </h3>
              <p className="text-[#D4A047] font-semibold mb-2">
                Technical Specialist
              </p>
              <p className="text-[#654321] text-sm">
                Chuyên gia kỹ thuật với kiến thức sâu rộng về đàn guitar và phụ
                kiện, đảm bảo mỗi sản phẩm đều đạt tiêu chuẩn cao nhất.
              </p>
            </div>

            <div className="text-center">
              <div className="w-32 h-32 bg-gray-300 rounded-full mx-auto mb-6 flex items-center justify-center">
                <span className="text-4xl text-gray-600">🎵</span>
              </div>
              <h3 className="text-xl font-bold text-[#2c3e50] mb-2">Thu Hà</h3>
              <p className="text-[#D4A047] font-semibold mb-2">
                Customer Experience
              </p>
              <p className="text-[#654321] text-sm">
                Chuyên viên chăm sóc khách hàng, luôn sẵn sàng tư vấn và hỗ trợ
                khách hàng tìm được sản phẩm phù hợp nhất.
              </p>
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="bg-[#F8F9FA] p-12 rounded-lg text-center">
          <h2 className="text-3xl font-bold text-[#2c3e50] mb-4">
            Sẵn Sàng Bắt Đầu Hành Trình Âm Nhạc?
          </h2>
          <p className="text-[#654321] mb-8 text-lg">
            Hãy liên hệ với chúng tôi để được tư vấn và tìm cây đàn guitar phù
            hợp nhất.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="px-8 py-3 bg-[#D4A047] text-white rounded-lg hover:bg-[#B8860B] transition-colors font-semibold"
            >
              Liên Hệ Ngay
            </Link>
            <Link
              href="/products"
              className="px-8 py-3 border-2 border-[#D4A047] text-[#D4A047] rounded-lg hover:bg-[#D4A047] hover:text-white transition-colors font-semibold"
            >
              Xem Sản Phẩm
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
