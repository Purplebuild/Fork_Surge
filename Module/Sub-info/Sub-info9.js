/*
 * 本模块由@Rabbit-Spec编写
 * 本人仅针对个人审美进行部分微调
 * 更新日期：2023.06.17
*/

(async () => {
  let args = getArgs();
  let info = await getDataInfo(args.url);
  if (!info) $done();
  let resetDayLeft = getRmainingDays(parseInt(args["reset_day"]));
  let expireDaysLeft = getExpireDaysLeft(args.expire || info.expire);

  let used = info.download + info.upload;
  let total = info.total;
  let content = [`用量：${bytesToSize(used)} │ ${bytesToSize(total)}`];

// 修改的部分
if (resetDayLeft && expireDaysLeft) {
  content.push(`提醒：${resetDayLeft}天后重置，${expireDaysLeft}天后到期`);
} else if (resetDayLeft) {
  content.push(`提醒：套餐将在${resetDayLeft}天后重置`);
} else if (expireDaysLeft) {
  content.push(`提醒：套餐将在${expireDaysLeft}天后到期`);
}

// 增加到期时间显示
if (expireDaysLeft) {
  content.push(`到期：${formatTime(args.expire || info.expire)}`);
}

$done({
  title: `${args.title}`,
  content: content.join("\n"),
  icon: args.icon || "icloud.fill",
  "icon-color": args.color || "#16AAF4",
});

  $done({
    title: `${args.title}`,
    content: content.join("\n"),
    icon: args.icon || "icloud.fill",
    "icon-color": args.color || "#16AAF4",
  });
})();

function getArgs() {
  return Object.fromEntries(
    $argument
      .split("&")
      .map((item) => item.split("="))
      .map(([k, v]) => [k, decodeURIComponent(v)])
  );
}

function getUserInfo(url) {
  let request = { headers: { "User-Agent": "Quantumult%20X" }, url };
  return new Promise((resolve, reject) =>
    $httpClient.get(request, (err, resp) => {
      if (err != null) {
        reject(err);
        return;
      }
      if (resp.status !== 200) {
        reject(resp.status);
        return;
      }
      let header = Object.keys(resp.headers).find((key) => key.toLowerCase() === "subscription-userinfo");
      if (header) {
        resolve(resp.headers[header]);
        return;
      }
      reject("链接响应头不带有流量信息");
    })
  );
}

async function getDataInfo(url) {
  const [err, data] = await getUserInfo(url)
    .then((data) => [null, data])
    .catch((err) => [err, null]);
  if (err) {
    console.log(err);
    return;
  }

  return Object.fromEntries(
    data
      .match(/\w+=[\d.eE+-]+/g)
      .map((item) => item.split("="))
      .map(([k, v]) => [k, Number(v)])
  );
}

function getRmainingDays(resetDay) {
  if (!resetDay) return;

  let now = new Date();
  let today = now.getDate();
  let month = now.getMonth();
  let year = now.getFullYear();
  let daysInMonth;

  if (resetDay > today) {
    daysInMonth = 0;
  } else {
    daysInMonth = new Date(year, month + 1, 0).getDate();
  }

  return daysInMonth - today + resetDay;
}

function getExpireDaysLeft(expire) {
  if (!expire) return;

  let now = new Date().getTime();
  if (/^[\d.]+$/.test(expire)) expire *= 1000;
  let daysLeft = Math.ceil((expire - now) / (1000 * 60 * 60 * 24));
  return daysLeft > 0 ? daysLeft : null;
}

function bytesToSize(bytes) {
  if (bytes === 0) return "0B";
  let k = 1024;
  sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  let i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(2) + " " + sizes[i];
}

function formatTime(time) {
  // 检查时间戳是否为秒单位，如果是，则转换为毫秒
  if (time < 1000000000000) time *= 1000;

  let dateObj = new Date(time);
  let year = dateObj.getFullYear();
  let month = dateObj.getMonth() + 1;
  let day = dateObj.getDate();
  return year + "年" + month + "月" + day + "日";
}
