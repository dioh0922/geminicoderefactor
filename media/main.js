const form = document.getElementById('callBtn');

// フォームが存在するか確認
if (form) {
    // submit イベントのリスナーを追加
    form.addEventListener('click', (event) => {
        document.getElementById("result").innerHTML = "test";
    });
}
