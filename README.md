# TransferToWindow  
将指定窗口大小的数据转化输出到另一窗口，并可缩放平移操作新窗口

### 1. 安装   
```
npm install transfer-to-window
```

### 2. 构造 
```typescript
new TransferToWindow(
  param: {
    // 输入宽
    inw: number,
    // 输入高
    inh: number,
    // 输出宽
    outw: number,
    // 输出高
    outh: number,
    // 输入窗口转化到输出窗口后最小的宽高尺寸；默认值:1
    minWH?: number,
    // 输入窗口转化到输出窗口后最大的宽高尺寸；默认值:Infinity
    minWH?: number,
    // 是否限制数据始终有区域位于窗口内部
    limitInWindow?: boolean,
    // 显示在窗口内部的最小值
    limitSize?: number,
  },
  // 是否计算输入输出窗口之间的变化矩阵
  slient?: boolean
) => TransferToWindow
```   

### 3. API
- 平移
```typescript
translate(dx: number, dy: number) => void
```

- 缩放；以(cx,cy)为中心缩放ratio比例
```typescript
zoom(cx: number, cy: number, ratio: number) => void
```

- 将输入数据完整放置于输出窗口的正中间
```typescript
resize() => void
```

- 将输入窗口的roi:[x,y,width,heigght]区域放置于输出窗口正中间
```typescript
scrollToRect(x: number, y: number, width: number, height: number, margin?: number) => void
```

- 更新输入->输出矩阵
```typescript
updateMatrix(scale: number, dx: number, dy: number) => void
```

- 坐标(x,y)是否位于输入视框内
```typescript
inCoorIsIn(x: number, y: number) => boolean
```

- 坐标(x,y)是否位于输出视框内
```typescript
outCoorIsIn(x: number, y: number) => boolean
```

- 将输入坐标组(x,y,...)转化为输出坐标组
```typescript
transInToOut(coors: number[]) => number[]
```

- 将输出坐标组(x,y,...)转化为输入坐标组
```typescript
transOutToIn(coors: number[]) => number[]
``` 

### 使用
以下为在浏览器视窗内显示并缩放平移一个HTMLElement的示例
##### html
```html
<div id="transfer-to-window">
  <div class="content" style="width: 16384px; height: 16384px;">
    <svg width="16384" height="16384" viewBox="0 0 16384 16384" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid" patternUnits="userSpaceOnUse" width="512" height="512">
          <g stroke-width="10" stroke="#000" stroke-opacity="1" fill="none">
            <path d="M0,0L512,512 M0,512L512,0 M256,0L0,256 M512,256L256,512 M0,256L256,512 M256,0L512,256" />
          </g>
        </pattern>
      </defs>
      <rect x="0" y="0" width="16384" height="16384" fill="url(#grid)" />
    </svg>
  </div>
</div>
```

##### css
```css
html,
body,
#transfer-to-window {
  width: 100%;
  height: 100%;
  margin: 0;
  overflow: hidden;
}

#transfer-to-window {
  position: fixed;
  inset: 0;
  z-index: 10;
}

#transfer-to-window>.content {
  transform-origin: 0 0 0;
}
```

##### javascript
```javascript
import { TransferToWindow } from 'transfer-to-window';
window.onload = function () {
  const ele = document.getElementById('transfer-to-window');
  const transfer2window = new TransferToWindow({
    inw: 16384,
    inh: 16384,
    outw: ele.clientWidth,
    outh: ele.clientHeight,
    limitInWindow: true,
  })
  setTransform();

  /**
  * 获取鼠标相对于el的坐标
  */
  function getPosition(e) {
    let rect = ele.getBoundingClientRect();
    return [e.pageX - rect.left, e.pageY - rect.top];
  }

  /**
  * 设置样式
  */
  function setTransform() {
    ele.firstElementChild.style.transform = `translate(${transfer2window.dx}px, ${transfer2window.dy}px) scale(${transfer2window.scale})`
  }

  /**
    * 重置
    */
  document.addEventListener('keyup', function (e) {
    transfer2window.resize();
    setTransform();
  })

  /**
    * 缩放
    */
  ele.addEventListener('wheel', function (e) {
    const coor = getPosition(e);
    transfer2window.zoom(coor[0], coor[1], e.deltaY < 0 ? 1.1 : 0.9);
    setTransform();
  })

  /**
    * 平移
    */
  let pos;
  ele.addEventListener('mousedown', function (e) {
    pos = getPosition(e);
    document.addEventListener('mousemove', mousemove)
    document.addEventListener('mouseup', mouseup)
  })
  function mousemove(e) {
    const cur = getPosition(e);
    transfer2window.translate(cur[0] - pos[0], cur[1] - pos[1]);
    pos = cur;
    setTransform();
  }
  function mouseup() {
    document.removeEventListener('mousemove', mousemove)
    document.removeEventListener('mouseup', mouseup)
  }
}
```
- 其它： [transform-image-data](https://www.npmjs.com/package/transform-image-data)
