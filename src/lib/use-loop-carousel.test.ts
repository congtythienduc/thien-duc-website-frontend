import { act, renderHook } from "@testing-library/react";
import { useLoopCarousel } from "./use-loop-carousel";

beforeEach(() => {
  jest.useFakeTimers();
  window.matchMedia = jest.fn().mockReturnValue({ matches: false });
});
afterEach(() => jest.useRealTimers());

it("giữ lệnh quay lại trong khi lượt tiến còn đang trượt", () => {
  const { result } = renderHook(() => useLoopCarousel(4, 700));
  act(() => result.current.next());
  expect(result.current.activeIndex).toBe(1);
  act(() => result.current.previous());
  act(() => jest.advanceTimersByTime(780));
  act(() => jest.advanceTimersByTime(20));
  expect(result.current.activeIndex).toBe(0);
  act(() => jest.advanceTimersByTime(780));
  expect(result.current.animate).toBe(false);
});

it("nối vòng về slide thật trước khi chạy lệnh đang chờ", () => {
  const { result } = renderHook(() => useLoopCarousel(4, 700));
  act(() => result.current.previous());
  expect(result.current.position).toBe(0);
  act(() => result.current.next());
  act(() => jest.advanceTimersByTime(780));
  expect(result.current.position).toBe(4);
  expect(result.current.animate).toBe(false);
  act(() => jest.advanceTimersByTime(20));
  expect(result.current.activeIndex).toBe(0);
  act(() => jest.advanceTimersByTime(780));
  expect(result.current.position).toBe(1);
});

it("giảm chuyển động: thao tác liên tiếp đổi slide ngay, không animate", () => {
  window.matchMedia = jest.fn().mockReturnValue({ matches: true });
  const { result } = renderHook(() => useLoopCarousel(4, 700));
  act(() => result.current.next());
  act(() => result.current.previous());
  expect(result.current.activeIndex).toBe(0);
  expect(result.current.animate).toBe(false);
});
