
    const searchBtn = document.getElementById("searchBtn");

    searchBtn.addEventListener("click", async () => {
      const examNumber = document.getElementById("examNumber").value.trim();
      const year = document.getElementById("year").value.trim();
      const resultDiv = document.getElementById("result");
      const errorDiv = document.getElementById("error");

      resultDiv.style.display = "none";
      errorDiv.textContent = "";

      if (!examNumber || !year) {
        errorDiv.textContent = "ادخلي رقم الفحص وسنة الفحص";
        return;
      }

      try {
        const res = await fetch(`/api/search`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ examNumber, year })
        });
        if (res.ok) {
          const data = await res.json();

          document.getElementById("resExamNumber").textContent = data.ExamNumber || data["رقم الفحص"] || "";
          document.getElementById("resYear").textContent = data.Year || data["السنة"] || "";
          document.getElementById("caseNumber").textContent = data.CaseNumber || data["رقم القضية"] || "";
          document.getElementById("applicantName").textContent = data.Applicant || data["اسم مقدم الطلب"] || "";
          document.getElementById("status").textContent = data.Status || data["حالة الفحص"] || data["حالة الطلب"] || "";
          document.getElementById("visa").textContent = data.Signatures || data["التأشيرات"] || "";
          document.getElementById("notes").textContent = data.Notes || data["ملاحظات"] || "";

          resultDiv.style.display = "block";
        } else if (res.status === 404) {
          errorDiv.textContent = "لا توجد بيانات";
        } else {
          errorDiv.textContent = "حدث خطأ، حاولى مرة اخرى";
        }
      } catch (err) {
        errorDiv.textContent = "حدث خطأ فى الاتصال بالسيرفر";
        console.error(err);
      }
    });
 